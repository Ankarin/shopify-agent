import { db } from "@/db";
import { chats } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

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

        const organizationChats = await db
            .select()
            .from(chats)
            .where(eq(chats.organizationId, orgId))
            .orderBy(desc(chats.createdAt));

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

        const newChat = await db
            .insert(chats)
            .values({
                organizationId: orgId,
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

