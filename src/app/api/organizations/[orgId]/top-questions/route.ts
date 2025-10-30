import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq, sql, and, gte, isNotNull } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: { orgId: string } }
) {
    try {
        const { orgId } = params;
        const { searchParams } = new URL(req.url);
        const days = Number.parseInt(searchParams.get('days') || '30');

        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);

        const topQuestions = await db
            .select({
                topic: chats.questionTopic,
                question: sql<string>`max(${chats.questionText})`,
                count: sql<number>`count(*)::int`,
                resolvedCount: sql<number>`sum(case when ${chats.resolved} = 1 then 1 else 0 end)::int`,
                unresolvedCount: sql<number>`sum(case when ${chats.unresolved} = 1 then 1 else 0 end)::int`,
            })
            .from(chats)
            .where(
                and(
                    eq(chats.organizationId, orgId),
                    gte(chats.createdAt, dateThreshold),
                    isNotNull(chats.questionTopic),
                    isNotNull(chats.questionText)
                )
            )
            .groupBy(chats.questionTopic)
            .orderBy(sql`count(*) desc`)
            .limit(20);

        const topicsSummary = await db
            .select({
                topic: chats.questionTopic,
                count: sql<number>`count(*)::int`,
                resolvedCount: sql<number>`sum(case when ${chats.resolved} = 1 then 1 else 0 end)::int`,
                unresolvedCount: sql<number>`sum(case when ${chats.unresolved} = 1 then 1 else 0 end)::int`,
            })
            .from(chats)
            .where(
                and(
                    eq(chats.organizationId, orgId),
                    gte(chats.createdAt, dateThreshold),
                    isNotNull(chats.questionTopic)
                )
            )
            .groupBy(chats.questionTopic)
            .orderBy(sql`count(*) desc`);

        return NextResponse.json({
            topQuestions,
            topicsSummary,
            period: `Last ${days} days`,
        });
    } catch (error: any) {
        console.error('Error fetching top questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch top questions' },
            { status: 500 }
        );
    }
}

