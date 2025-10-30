import { db } from "@/db";
import { chats, organizations } from "@/db/schema";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAfterHours } from "@/lib/utils/business-hours";
import { eq } from "drizzle-orm";

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
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await params;
        const body = await request.json();

        const { customerName, customerEmail } = body;

        const organization = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, orgId))
            .limit(1);

        const org = organization[0];
        const now = new Date();
        const afterHoursFlag = org ? isAfterHours(
            now,
            org.timezone || 'Europe/London',
            org.businessHoursStart || 9,
            org.businessHoursEnd || 17
        ) : false;

        const newChat = await db
            .insert(chats)
            .values({
                organizationId: orgId,
                customerName: customerName || null,
                customerEmail: customerEmail || null,
                afterHours: afterHoursFlag ? 1 : 0,
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
