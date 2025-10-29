import { db } from "@/db";
import { chats, organizations } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { isAfterHours } from "@/lib/utils/business-hours";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = await params;
        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'all';

        let query = db
            .select()
            .from(chats)
            .where(eq(chats.organizationId, orgId));

        if (filter === 'resolved') {
            query = db
                .select()
                .from(chats)
                .where(and(eq(chats.organizationId, orgId), eq(chats.resolved, 1)));
        } else if (filter === 'unresolved') {
            query = db
                .select()
                .from(chats)
                .where(and(eq(chats.organizationId, orgId), eq(chats.unresolved, 1)));
        }

        const organizationChats = await query.orderBy(desc(chats.createdAt));

        return NextResponse.json(organizationChats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        return NextResponse.json(
            { error: "Failed to fetch chats" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = await params;

        const organization = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, orgId))
            .limit(1);

        if (!organization || organization.length === 0) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        const org = organization[0];
        const now = new Date();
        const afterHoursFlag = isAfterHours(
            now,
            org.timezone || 'Europe/London',
            org.businessHoursStart || 9,
            org.businessHoursEnd || 17
        );

        const newChat = await db
            .insert(chats)
            .values({
                organizationId: orgId,
                afterHours: afterHoursFlag ? 1 : 0,
            })
            .returning();

        return NextResponse.json(newChat[0]);
    } catch (error) {
        console.error("Error creating chat:", error);
        return NextResponse.json(
            { error: "Failed to create chat" },
            { status: 500 }
        );
    }
}

