import { openai } from "@ai-sdk/openai";
import { Redis } from "@upstash/redis";
import { convertToModelMessages, createIdGenerator, streamText, UIMessage } from "ai";
import { NextRequest } from "next/server";

const redis = new Redis({
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    url: process.env.UPSTASH_REDIS_REST_URL,
});

export const POST = async (req: NextRequest) => {
    const body = await req.json();

    const { message, id } = body as { message: UIMessage; id: string };

    const history = await redis.get<UIMessage[]>(`chat:history:${id}`);

    const messages = [...(history ?? []), message];

    const result = streamText({
        model: 'openai/gpt-5-mini',
        messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
        originalMessages: messages ?? [],
        generateMessageId: createIdGenerator({
            prefix: "msg",
            size: 16,
        }),
        onFinish: async ({ messages }) => {
            await redis.set(`chat:history:${id}`, messages);
        },
    });
};