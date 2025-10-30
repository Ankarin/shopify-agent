import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

const QUESTION_TOPICS = [
    "ORDERS",
    "TRACKING",
    "SHIPPING_DELIVERY",
    "PRODUCTS",
    "PAYMENTS",
    "DISCOUNTS_OFFERS",
    "ACCOUNT_MANAGEMENT",
    "PRODUCT_ISSUES_FAULTY",
    "SIZING_FIT",
    "STOCK_AVAILABILITY",
    "POLICIES_TERMS",
    "LOYALTY_SUBSCRIPTIONS",
    "GENERAL_PRE_SALE"
] as const;

export const createClassifyQuestionTool = (chatId: string) => tool({
    description: 'Classify the customer\'s main question or inquiry into a topic category. Call this tool early in the conversation once you understand what the customer is asking about. This helps track the most frequently asked questions.',
    inputSchema: z.object({
        topic: z.enum(QUESTION_TOPICS).describe('The main topic category of the customer\'s question: ORDERS, TRACKING, SHIPPING_DELIVERY, PRODUCTS, PAYMENTS, DISCOUNTS_OFFERS, ACCOUNT_MANAGEMENT, PRODUCT_ISSUES_FAULTY, SIZING_FIT, STOCK_AVAILABILITY, POLICIES_TERMS, LOYALTY_SUBSCRIPTIONS, or GENERAL_PRE_SALE'),
        questionText: z.string().describe('The actual question the customer asked, summarized clearly (e.g., "Where is my order?", "How do I track my shipment?", "Do you offer student discounts?"). For stock availability questions, always use "What items are in stock?" regardless of the exact phrasing.'),
    }),
    execute: async ({ topic, questionText }) => {
        console.log('📊 [Tool: classifyQuestion] Classifying question for chat:', chatId, 'Topic:', topic, 'Question:', questionText);

        try {
            await db
                .update(chats)
                .set({
                    questionTopic: topic,
                    questionText: questionText
                })
                .where(eq(chats.id, chatId));

            console.log('✅ [Tool: classifyQuestion] Question classified and saved');

            return `Question classified as "${topic}": ${questionText}`;
        } catch (error: any) {
            console.error('❌ [Tool: classifyQuestion] Error:', error);
            throw new Error('Failed to classify question');
        }
    },
});

