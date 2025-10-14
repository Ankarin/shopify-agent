import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, chatConversions, chatMessages, organizations } from "@/db/schema";
import { sql, desc, gte, and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
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
            topQuestionsResult,
            orgBreakdownResult,
        ] = await Promise.all([
            db.select({
                count: sql<number>`count(*)::int`,
                messageCount: sql<number>`coalesce(sum(${chats.messageCount}), 0)::int`
            })
                .from(chats)
                .where(gte(chats.createdAt, startDate)),

            db.select({
                count: sql<number>`count(*)::int`
            })
                .from(chatConversions)
                .where(gte(chatConversions.createdAt, startDate)),

            db.select({
                totalRevenue: sql<number>`coalesce(sum(cast(${chatConversions.orderAmount} as numeric)), 0)`,
                currency: chatConversions.currency
            })
                .from(chatConversions)
                .where(gte(chatConversions.createdAt, startDate))
                .groupBy(chatConversions.currency),

            db.select({
                count: sql<number>`count(*)::int`
            })
                .from(chats)
                .where(
                    and(
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
                        eq(chats.resolved, 1),
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
                        eq(chatMessages.role, 'user'),
                        gte(chatMessages.createdAt, startDate)
                    )
                )
                .groupBy(chatMessages.content)
                .orderBy(desc(sql`count(*)`))
                .limit(10),

            db.select({
                orgId: chats.organizationId,
                orgName: organizations.name,
                totalChats: sql<number>`count(distinct ${chats.id})::int`,
                totalMessages: sql<number>`coalesce(sum(${chats.messageCount}), 0)::int`,
                totalConversions: sql<number>`count(distinct ${chatConversions.id})::int`,
                totalRevenue: sql<number>`coalesce(sum(cast(${chatConversions.orderAmount} as numeric)), 0)`,
                escalated: sql<number>`sum(case when ${chats.escalated} = 1 then 1 else 0 end)::int`,
                resolved: sql<number>`sum(case when ${chats.resolved} = 1 then 1 else 0 end)::int`,
            })
                .from(chats)
                .innerJoin(organizations, eq(chats.organizationId, organizations.id))
                .leftJoin(chatConversions, eq(chats.id, chatConversions.chatId))
                .where(gte(chats.createdAt, startDate))
                .groupBy(chats.organizationId, organizations.name)
                .orderBy(desc(sql`count(distinct ${chats.id})`)),
        ]);

        const totalChats = totalChatsResult[0]?.count || 0;
        const totalMessages = totalChatsResult[0]?.messageCount || 0;
        const totalConversions = totalConversionsResult[0]?.count || 0;
        const escalatedCount = escalatedChatsResult[0]?.count || 0;
        const resolvedCount = resolvedChatsResult[0]?.count || 0;

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

        const clientBreakdown = orgBreakdownResult.map(org => ({
            id: org.orgId,
            name: org.orgName,
            totalChats: org.totalChats,
            totalMessages: org.totalMessages,
            totalConversions: org.totalConversions,
            totalRevenue: parseFloat(org.totalRevenue as any) || 0,
            escalated: org.escalated,
            resolved: org.resolved,
            conversationResolvedPercentage: org.totalChats > 0 ? Math.round((org.resolved / org.totalChats) * 100 * 100) / 100 : 0,
        }));

        return NextResponse.json({
            period: {
                days,
                startDate: startDate.toISOString(),
                endDate: new Date().toISOString(),
            },
            overall: {
                totalChats,
                totalMessages,
                totalConversions,
                conversationResolvedPercentage: Math.round(conversationResolvedPercentage * 100) / 100,
                revenue: revenueByurrency,
                escalated: escalatedCount,
                resolved: resolvedCount,
                inProgress: totalChats - escalatedCount - resolvedCount,
            },
            topQuestions,
            clientBreakdown,
        });
    } catch (error) {
        console.error('Error fetching overall analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}

