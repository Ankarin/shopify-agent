import { Redis } from '@upstash/redis';
import { UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { eq } from 'drizzle-orm';

const redis = new Redis({
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    url: process.env.UPSTASH_REDIS_REST_URL,
});

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string; chatId: string }> }
) {
    try {
        const { orgId, chatId } = await params;

        const history = await redis.get<UIMessage[]>(`chat:history:${chatId}`);

        const chat = await db.select({
            customerName: chats.customerName,
            customerEmail: chats.customerEmail,
            updatedAt: chats.updatedAt,
        }).from(chats).where(eq(chats.id, chatId)).limit(1);

        return NextResponse.json({
            orgId,
            chatId,
            status: 'active',
            messages: history || [],
            customerName: chat[0]?.customerName || null,
            customerEmail: chat[0]?.customerEmail || null,
            updatedAt: chat[0]?.updatedAt || null,
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        console.error('Error fetching chat:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat' },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
}

