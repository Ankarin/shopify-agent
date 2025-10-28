import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await params;

        const emails = await db
            .select({
                email: chats.customerEmail,
                name: chats.customerName,
                count: sql<number>`count(*)::int`,
                lastUsed: sql<string>`max(${chats.createdAt})::text`,
            })
            .from(chats)
            .where(eq(chats.organizationId, orgId))
            .groupBy(chats.customerEmail, chats.customerName)
            .having(sql`${chats.customerEmail} IS NOT NULL AND ${chats.customerEmail} != ''`)
            .orderBy(sql`max(${chats.createdAt}) DESC`);

        return NextResponse.json({ emails });
    } catch (error) {
        console.error("Error fetching emails:", error);
        return NextResponse.json(
            { error: "Failed to fetch emails" },
            { status: 500 }
        );
    }
}

