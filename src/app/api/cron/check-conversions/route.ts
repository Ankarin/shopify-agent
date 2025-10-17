import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, chatConversions, organizations } from "@/db/schema";
import { eq, and, gte, isNull, sql } from "drizzle-orm";
import { ShopifyClient } from "@/lib/shopify/client";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const windowDays = 7;
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - windowDays);

        const chatsWithContact = await db
            .select({
                chatId: chats.id,
                orgId: chats.organizationId,
                email: chats.customerEmail,
                phone: chats.customerPhone,
                chatCreatedAt: chats.createdAt,
                shopifyDomain: organizations.shopifyDomain,
                shopifyAccessToken: organizations.shopifyAccessToken,
            })
            .from(chats)
            .innerJoin(organizations, eq(chats.organizationId, organizations.id))
            .where(
                and(
                    gte(chats.createdAt, startTime),
                    sql`(${chats.customerEmail} IS NOT NULL OR ${chats.customerPhone} IS NOT NULL)`,
                    sql`${organizations.shopifyDomain} IS NOT NULL`,
                    sql`${organizations.shopifyAccessToken} IS NOT NULL`
                )
            );

        let newConversions = 0;
        const errors: string[] = [];

        for (const chat of chatsWithContact) {
            try {
                const shopifyClient = new ShopifyClient({
                    domain: chat.shopifyDomain!,
                    accessToken: chat.shopifyAccessToken!,
                });

                let orders: any[] = [];
                if (chat.email) {
                    orders = await shopifyClient.getOrderByEmail(chat.email, 10);
                } else if (chat.phone) {
                    orders = await shopifyClient.getOrderByPhone(chat.phone, 10);
                }

                for (const order of orders) {
                    const orderDate = new Date(order.createdAt);
                    const chatDate = new Date(chat.chatCreatedAt);

                    if (orderDate > chatDate && orderDate.getTime() - chatDate.getTime() <= windowDays * 24 * 60 * 60 * 1000) {
                        const existingConversion = await db
                            .select()
                            .from(chatConversions)
                            .where(
                                and(
                                    eq(chatConversions.chatId, chat.chatId),
                                    eq(chatConversions.shopifyOrderId, order.id)
                                )
                            )
                            .limit(1);

                        if (existingConversion.length === 0) {
                            await db.insert(chatConversions).values({
                                chatId: chat.chatId!,
                                organizationId: chat.orgId!,
                                customerEmail: chat.email || undefined,
                                customerPhone: chat.phone || undefined,
                                shopifyOrderId: order.id,
                                orderNumber: order.name,
                                orderAmount: order.totalPriceSet.shopMoney.amount,
                                currency: order.totalPriceSet.shopMoney.currencyCode,
                                orderDate: new Date(order.createdAt),
                                attributionWindow: '7d',
                            });

                            newConversions++;
                            console.log(`✅ Created conversion for chat ${chat.chatId} - order ${order.name}`);
                        }
                    }
                }
            } catch (error: any) {
                console.error(`❌ Error processing chat ${chat.chatId}:`, error);
                errors.push(`Chat ${chat.chatId}: ${error.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            processed: chatsWithContact.length,
            newConversions,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error: any) {
        console.error('❌ Cron job error:', error);
        return NextResponse.json(
            { error: 'Failed to check conversions', details: error.message },
            { status: 500 }
        );
    }
}

