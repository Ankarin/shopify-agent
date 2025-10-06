import { Redis } from "@upstash/redis";
import { convertToModelMessages, createIdGenerator, streamText, UIMessage, stepCountIs } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ShopifyClient } from "@/lib/shopify/client";
import {
    createLookupOrderByEmailTool,
    createLookupOrderByNumberTool,
    createGetProductTool,
    createListProductsTool
} from "@/tools/shopify";

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

    const systemPrompt = `You are a helpful AI assistant for ${organization.name}, a Shopify online store. 
        
Store Information:
- Store Name: ${organization.name}
- Website: ${organization.website}
${organization.data ? `- Store Data: ${JSON.stringify(organization.data, null, 2)}` : ''}

Your role is to help customers with:
1. FAQs and general store questions
2. Product information (features, sizes, prices, availability)
3. Order tracking and delivery questions
4. Customer service inquiries

Be friendly, helpful, and proactive. When customers ask about orders, products, or need help:
- Ask for necessary information (email for orders, product details for questions)
- Use the available tools to fetch accurate real-time data from Shopify
- Provide clear, detailed responses with tracking numbers, delivery estimates, product details, etc.
- If a customer asks "Where is my order?", ask for their email or order number to look it up
- When you retrived some data from Shopify, don't just stop, continue the conversation with the customer and explain what you found.
`;

    let tools = undefined;
    if (organization.shopifyDomain && organization.shopifyAccessToken) {
        const shopifyClient = new ShopifyClient({
            domain: organization.shopifyDomain,
            accessToken: organization.shopifyAccessToken,
        });

        tools = {
            lookupOrderByEmail: createLookupOrderByEmailTool(shopifyClient),
            lookupOrderByNumber: createLookupOrderByNumberTool(shopifyClient),
            getProduct: createGetProductTool(shopifyClient),
            listProducts: createListProductsTool(shopifyClient),
        };
    }

    console.log('🤖 [Chat API] Starting streamText with', {
        model: 'openai/gpt-5-mini',
        hasTools: !!tools,
        toolNames: tools ? Object.keys(tools) : [],
        messagesCount: messages.length,
    });

    const result = streamText({
        model: 'anthropic/claude-4-5-sonnet',
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
            await redis.set(`chat:history:${id}`, messages);
        },
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
};