import { db } from "@/db";
import { chats } from "@/db/schema";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await params;

        // Create new chat for public widget (no auth required)
        const newChat = await db
            .insert(chats)
            .values({
                organizationId: orgId,
            })
            .returning();

        return NextResponse.json(newChat[0], {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        console.error("Error creating widget chat:", error);
        return NextResponse.json(
            { error: "Failed to create chat" },
            { 
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
}
