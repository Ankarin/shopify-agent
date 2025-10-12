import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string; chatId: string }> }
) {
    try {
        const { chatId, orgId } = await params;
        const body = await req.json();

        const { customerEmail, customerPhone } = body;

        if (!customerEmail && !customerPhone) {
            return NextResponse.json(
                { error: 'At least one of customerEmail or customerPhone is required' },
                { status: 400 }
            );
        }

        const updateData: any = {};
        if (customerEmail) updateData.customerEmail = customerEmail;
        if (customerPhone) updateData.customerPhone = customerPhone;

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
        console.error('Error updating chat contact:', error);
        return NextResponse.json(
            { error: 'Failed to update chat contact' },
            { status: 500 }
        );
    }
}

