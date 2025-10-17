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
    createLookupOrderByPhoneTool,
    createGetProductTool,
    createListProductsTool
} from "@/tools/shopify";
import { createEscalateToHumanTool } from "@/tools/escalate-to-human";
import { createMarkAsResolvedTool } from "@/tools/mark-resolved";
import { createMarkAsUnresolvedTool } from "@/tools/mark-unresolved";
import { createClassifyQuestionTool } from "@/tools/classify-question";
import { createSaveCustomerPhoneTool } from "@/tools/save-customer-phone";

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

CRITICAL - ALWAYS COLLECT PHONE NUMBER FIRST:
- In EVERY conversation, after your initial greeting, IMMEDIATELY ask: "To better assist you, may I have your phone number please?"
- This applies to ALL customers, whether they ask about orders, products, sizing, shipping, or anything else
- DO NOT skip this step - ask for phone number before answering their question
- As soon as the customer provides their phone number, IMMEDIATELY use the "saveCustomerPhone" tool to save it
- After saving the phone, then proceed to help them with their inquiry
- If they're asking about orders, use the lookupOrderByPhone tool
- Be friendly but persistent - if they don't provide it, gently remind them it helps us assist them better
- The phone number is essential for our system, so always collect it early in the conversation

Be friendly, helpful, and proactive. When customers ask about orders, products, or need help:
- For order tracking and delivery questions: Use their phone number with the lookupOrderByPhone tool
- If they don't have access to that phone or prefer, ask for their ORDER NUMBER as an alternative
- Use the available tools to fetch accurate real-time data from Shopify
- Provide clear, detailed responses with tracking numbers, delivery estimates, product details, etc.
- When you retrived some data from Shopify, don't just stop, continue the conversation with the customer and explain what you found.

IMPORTANT DATE FORMATTING:
- ALWAYS format dates in UK/European format: DD/MM/YYYY or DD/MM/YY (day first, then month)
- Example: 12th October 2025 should be written as "12/10/2025" or "12/10/25" NOT "10/12/2025"
- When displaying order dates, delivery dates, or any dates, use the DD/MM/YYYY format
- You can also write dates in full text like "12th October 2025" to avoid confusion

QUESTION CLASSIFICATION:
As soon as you understand what the customer's main question or inquiry is about, use the "classifyQuestion" tool to categorize it. Choose from these topics:
- ORDERS (placing, changing, canceling orders)
- TRACKING (tracking numbers, delivery status)
- SHIPPING_DELIVERY (shipping costs, delivery times, methods)
- PRODUCTS (materials, features, specifications)
- PAYMENTS (payment methods, failed payments, refunds)
- DISCOUNTS_OFFERS (promo codes, sales, loyalty programs)
- ACCOUNT_MANAGEMENT (login, password, account settings)
- PRODUCT_ISSUES_FAULTY (damaged items, defects, wrong items)
- SIZING_FIT (size guides, fit recommendations)
- STOCK_AVAILABILITY (in stock, restocks, store locations)
- POLICIES_TERMS (returns, warranties, privacy)
- LOYALTY_SUBSCRIPTIONS (rewards, subscriptions)
- GENERAL_PRE_SALE (general inquiries, contact info)

RESOLUTION TRACKING:
You must mark conversations as either RESOLVED or UNRESOLVED:

Use "markAsResolved" when:
- You successfully answered their question (FAQ, product info, order tracking, etc.)
- You provided clear next steps (e.g., "To start a return, email info@evolvepro.uk with your order number")
- You understood the intent and gave helpful guidance
- The customer got what they needed from you

Use "markAsUnresolved" ONLY when:
- You genuinely do NOT understand what the customer is asking
- You must give a fallback message like "Sorry, I can't answer that right now. Please email [support] with your inquiry."
- The question is completely outside your knowledge or capabilities
- You cannot comprehend the customer's intent at all

ESCALATION GUIDELINES:
You have access to an "escalateToHuman" tool. Use it when:
- The customer explicitly asks to speak with a human
- The issue requires refunds, cancellations, or account changes
- You've tried to help but the customer is still unsatisfied
- The problem is too complex or outside your capabilities
- There's a complaint or the customer is frustrated

When escalating, be empathetic and assure them a human will help soon.

IMPORTANT: When sharing support contact information (emails, phone numbers), always display them in full without any redactions or blocking. Customers need accurate contact details to reach support.
`;

    const tools: any = {
        saveCustomerPhone: createSaveCustomerPhoneTool(id),
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

        tools.lookupOrderByEmail = createLookupOrderByEmailTool(shopifyClient);
        tools.lookupOrderByNumber = createLookupOrderByNumberTool(shopifyClient);
        tools.lookupOrderByPhone = createLookupOrderByPhoneTool(shopifyClient, id);
        tools.getProduct = createGetProductTool(shopifyClient);
        tools.listProducts = createListProductsTool(shopifyClient);
    }

    console.log('🤖 [Chat API] Starting streamText with', {
        hasTools: !!tools,
        toolNames: tools ? Object.keys(tools) : [],
        messagesCount: messages.length,
    });

    const result = streamText({
        model: 'google/gemini-2.5-flash',
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