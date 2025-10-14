import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, chatConversions, chatMessages, organizations } from "@/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await params;
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [
            totalChatsResult,
            totalConversionsResult,
            revenueResult,
            escalatedChatsResult,
            resolvedChatsResult,
            afterHoursChatsResult,
            topQuestionsResult,
        ] = await Promise.all([
            db.select({
                count: sql<number>`count(*)::int`,
                messageCount: sql<number>`coalesce(sum(${chats.messageCount}), 0)::int`
            })
                .from(chats)
                .where(
                    and(
                        eq(chats.organizationId, orgId),
                        gte(chats.createdAt, startDate)
                    )
                ),

            db.select({
                count: sql<number>`count(*)::int`
            })
                .from(chatConversions)
                .where(
                    and(
                        eq(chatConversions.organizationId, orgId),
                        gte(chatConversions.createdAt, startDate)
                    )
                ),

            db.select({
                totalRevenue: sql<number>`coalesce(sum(cast(${chatConversions.orderAmount} as numeric)), 0)`,
                currency: chatConversions.currency
            })
                .from(chatConversions)
                .where(
                    and(
                        eq(chatConversions.organizationId, orgId),
                        gte(chatConversions.createdAt, startDate)
                    )
                )
                .groupBy(chatConversions.currency),

            db.select({
                count: sql<number>`count(*)::int`
            })
                .from(chats)
                .where(
                    and(
                        eq(chats.organizationId, orgId),
                        eq(chats.escalated, 1),
                        gte(chats.createdAt, startDate)
                    )
                ),

            db.select({
                count: sql<number>`count(*)::int`
            })
                .from(chats)
                .where(
                    and(
                        eq(chats.organizationId, orgId),
                        eq(chats.resolved, 1),
                        gte(chats.createdAt, startDate)
                    )
                ),

            db.select({
                count: sql<number>`count(*)::int`
            })
                .from(chats)
                .where(
                    and(
                        eq(chats.organizationId, orgId),
                        eq(chats.afterHours, 1),
                        gte(chats.createdAt, startDate)
                    )
                ),

            db.select({
                content: chatMessages.content,
                count: sql<number>`count(*)::int`
            })
                .from(chatMessages)
                .innerJoin(chats, eq(chatMessages.chatId, chats.id))
                .where(
                    and(
                        eq(chats.organizationId, orgId),
                        eq(chatMessages.role, 'user'),
                        gte(chatMessages.createdAt, startDate)
                    )
                )
                .groupBy(chatMessages.content)
                .orderBy(desc(sql`count(*)`))
                .limit(10),
        ]);

        const totalChats = totalChatsResult[0]?.count || 0;
        const totalMessages = totalChatsResult[0]?.messageCount || 0;
        const totalConversions = totalConversionsResult[0]?.count || 0;
        const escalatedCount = escalatedChatsResult[0]?.count || 0;
        const resolvedCount = resolvedChatsResult[0]?.count || 0;
        const afterHoursCount = afterHoursChatsResult[0]?.count || 0;

        const revenueByurrency = revenueResult.reduce((acc, r) => {
            acc[r.currency || 'USD'] = parseFloat(r.totalRevenue as any) || 0;
            return acc;
        }, {} as Record<string, number>);

        const topQuestions = topQuestionsResult
            .filter(q => q.content && q.content.trim().length > 0)
            .map(q => ({
                question: q.content.substring(0, 200),
                count: q.count,
            }));

        const conversationResolvedPercentage = totalChats > 0 ? (resolvedCount / totalChats) * 100 : 0;

        return NextResponse.json({
            period: {
                days,
                startDate: startDate.toISOString(),
                endDate: new Date().toISOString(),
            },
            metrics: {
                totalChats,
                totalMessages,
                totalConversions,
                conversationResolvedPercentage: Math.round(conversationResolvedPercentage * 100) / 100,
                revenue: revenueByurrency,
                escalated: escalatedCount,
                resolved: resolvedCount,
                afterHours: afterHoursCount,
                inProgress: totalChats - escalatedCount - resolvedCount,
            },
            topQuestions,
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}

