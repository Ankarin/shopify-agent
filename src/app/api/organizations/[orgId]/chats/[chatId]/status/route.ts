import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string; chatId: string }> }
) {
    try {
        const { chatId } = await params;
        const body = await req.json();

        const { escalated, resolved } = body;

        const updateData: any = {};
        if (typeof escalated === 'number') updateData.escalated = escalated;
        if (typeof resolved === 'number') updateData.resolved = resolved;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'At least one of escalated or resolved is required' },
                { status: 400 }
            );
        }

        const [updatedChat] = await db
            .update(chats)
            .set(updateData)
            .where(eq(chats.id, chatId))
            .returning();

        if (!updatedChat) {
            return NextResponse.json(
                { error: 'Chat not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedChat);
    } catch (error) {
        console.error('Error updating chat status:', error);
        return NextResponse.json(
            { error: 'Failed to update chat status' },
            { status: 500 }
        );
    }
}

