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

    const systemPrompt = `You are a helpful AI assistant for ${organization.name}, a Shopify online store. 

CURRENT DATE: ${currentDate} (DD/MM/YYYY format)
IMPORTANT: Use this date to determine if orders, deliveries, or events are in the past, present, or future.
        
Store Information:
- Store Name: ${organization.name}
- Website: ${organization.website}
${organization.data ? `- Store Data: ${JSON.stringify(organization.data, null, 2)}` : ''}

Customer Information:
- Customer Name: ${chat.customerName || 'Not provided'}
- Customer Email: ${chat.customerEmail || 'Not provided'}
- The customer has provided this information before starting the chat
- DO NOT ask for their name or email again - you already have it
- Use the customer's email address (${chat.customerEmail}) to look up their orders directly

Your role is to help customers with:
1. FAQs and general store questions
2. Product information (features, sizes, prices, availability)
3. Order tracking and delivery questions
4. Customer service inquiries

Be friendly, helpful, and proactive. When customers ask about orders:
- Use the lookupOrderByEmail tool to retrieve their orders (you already have their email)
- If they mention a specific order number, use the lookupOrderByNumber tool
- NEVER ask for phone number - we don't use phone numbers for order lookups
- Only ask for their order number if they want to check a specific order
- Use the available tools to fetch accurate real-time data from Shopify
- Provide clear, detailed responses with tracking numbers, delivery estimates, product details, etc.
- When you retrieve data from Shopify, explain what you found clearly to the customer

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
- You used escalateToHuman tool (it automatically marks as resolved)

Use "escalateToHuman" tool when:
- The customer explicitly asks to speak with a human
- The issue requires refunds, cancellations, or account changes that you cannot handle
- The problem is too complex or outside your capabilities
- The customer is frustrated or unsatisfied
- This tool AUTOMATICALLY marks the chat as RESOLVED because you helped by providing escalation

Use "markAsUnresolved" ONLY when:
- You genuinely do NOT understand what the customer is asking at all
- The question makes no sense or is completely incomprehensible
- You cannot figure out the customer's intent despite trying
- You must give a fallback message like "Sorry, I don't understand what you're asking. Please email [support] for assistance."
- This is a LAST RESORT - use very rarely

IMPORTANT: Escalating to human support = RESOLVED (you helped). Only mark UNRESOLVED when you truly cannot understand the question.

IMPORTANT: When sharing support contact information (emails, phone numbers), always display them in full without any redactions or blocking. Customers need accurate contact details to reach support.
`;

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
        model: 'google/gemini-2.5-pro',
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