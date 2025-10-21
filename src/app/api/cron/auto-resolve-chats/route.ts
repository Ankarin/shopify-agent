import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { and, eq, lte, sql } from "drizzle-orm";

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
        const tenMinutesAgo = new Date();
        tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

        const chatsToResolve = await db
            .select({
                id: chats.id,
                updatedAt: chats.updatedAt,
            })
            .from(chats)
            .where(
                and(
                    eq(chats.escalated, 0),
                    eq(chats.resolved, 0),
                    lte(chats.updatedAt, tenMinutesAgo)
                )
            );

        let resolvedCount = 0;

        for (const chat of chatsToResolve) {
            await db
                .update(chats)
                .set({ resolved: 1 })
                .where(eq(chats.id, chat.id));

            resolvedCount++;
            console.log(`✅ Auto-resolved chat ${chat.id} (inactive for 10+ minutes)`);
        }

        return NextResponse.json({
            success: true,
            checkedTime: tenMinutesAgo.toISOString(),
            resolvedCount,
        });
    } catch (error: any) {
        console.error('❌ Auto-resolve cron job error:', error);
        return NextResponse.json(
            { error: 'Failed to auto-resolve chats', details: error.message },
            { status: 500 }
        );
    }
}

