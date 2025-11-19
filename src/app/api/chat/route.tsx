import { Redis } from "@upstash/redis";
import { convertToModelMessages, createIdGenerator, streamText, UIMessage, stepCountIs } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ShopifyClient } from "@/lib/shopify/client";
import {
    createLookupOrderByNumberTool,
    createLookupOrderByEmailTool,
    createGetProductTool,
    createListProductsTool
} from "@/tools/shopify";
import { createEscalateToHumanTool } from "@/tools/escalate-to-human";
import { createMarkAsResolvedTool } from "@/tools/mark-resolved";
import { createMarkAsUnresolvedTool } from "@/tools/mark-unresolved";
import { createClassifyQuestionTool } from "@/tools/classify-question";

const redis = new Redis({
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    url: process.env.UPSTASH_REDIS_REST_URL,
});

export const GET = async () => {
    return NextResponse.json(
        { status: 'ok', message: 'Chat API is running' },
        {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
    );
};

export const OPTIONS = async () => {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
};

export const POST = async (req: NextRequest) => {
    const body = await req.json();

    const { message, id } = body as { message: UIMessage; id: string };

    const [chat, history] = await Promise.all([
        db.query.chats.findFirst({
            where: eq(chats.id, id),
            with: {
                organization: true,
            },
        }),
        redis.get<UIMessage[]>(`chat:history:${id}`),
    ]);

    if (!chat || !chat.organization) {
        return NextResponse.json(
            { error: 'Chat or organization not found' },
            {
                status: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                }
            }
        );
    }

    const organization = chat.organization;

    const messages = [...(history ?? []), message];

    const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/London'
    });

    const promptTemplate = typeof organization.data === 'string' ? organization.data : null;

    const systemPrompt = promptTemplate
        ? promptTemplate
            .replace(/\{\{organizationName\}\}/g, organization.name)
            .replace(/\{\{currentDate\}\}/g, currentDate)
            .replace(/\{\{website\}\}/g, organization.website)
            .replace(/\{\{customerName\}\}/g, chat.customerName || 'Not provided')
            .replace(/\{\{customerEmail\}\}/g, chat.customerEmail || 'Not provided')
        : `You are a helpful AI assistant for ${organization.name}.`;

    const tools: any = {
        classifyQuestion: createClassifyQuestionTool(id),
        escalateToHuman: createEscalateToHumanTool(id),
        markAsResolved: createMarkAsResolvedTool(id),
        markAsUnresolved: createMarkAsUnresolvedTool(id),
    };

    if (organization.shopifyDomain && organization.shopifyAccessToken) {
        const shopifyClient = new ShopifyClient({
            domain: organization.shopifyDomain,
            accessToken: organization.shopifyAccessToken,
        });

        tools.lookupOrderByNumber = createLookupOrderByNumberTool(shopifyClient, id);
        tools.lookupOrderByEmail = createLookupOrderByEmailTool(shopifyClient, id);
        tools.getProduct = createGetProductTool(shopifyClient);
        tools.listProducts = createListProductsTool(shopifyClient);
    }

    console.log('🤖 [Chat API] Starting streamText with', {
        hasTools: !!tools,
        toolNames: tools ? Object.keys(tools) : [],
        messagesCount: messages.length,
    });

    const result = streamText({
        model: 'anthropic/claude-4.5-haiku',
        messages: convertToModelMessages(messages),
        system: systemPrompt,
        tools,
        stopWhen: stepCountIs(10),
    });

    const response = result.toUIMessageStreamResponse({
        originalMessages: messages ?? [],
        generateMessageId: createIdGenerator({
            prefix: "msg",
            size: 16,
        }),
        onFinish: async ({ messages }) => {
            await Promise.all([
                redis.set(`chat:history:${id}`, messages),
                db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, id))
            ]);
        },
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
};