import { Redis } from '@upstash/redis';
import { UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    url: process.env.UPSTASH_REDIS_REST_URL,
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string; chatId: string }> }
) {
    try {
        const { orgId, chatId } = await params;

        const history = await redis.get<UIMessage[]>(`chat:history:${chatId}`);

        return NextResponse.json({
            orgId,
            chatId,
            status: 'active',
            messages: history || [],
        });
    } catch (error) {
        console.error('Error fetching chat:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat' },
            { status: 500 }
        );
    }
}

