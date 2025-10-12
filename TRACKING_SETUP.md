# Conversion Tracking Setup

This document explains how the conversion tracking system works and how to set it up.

## Overview

The system tracks purchases made after chatbot interactions by:
1. Collecting customer email or phone during chat (naturally, when they ask about orders)
2. Periodically checking Shopify for orders from those contacts
3. Attributing orders to chats if they occurred within 24 hours of the conversation

## Database Schema

### Updated Tables

**organizations**
- `timezone`: Store timezone (default: Europe/London)
- `businessHoursStart`: Start hour in 24h format (default: 9)
- `businessHoursEnd`: End hour in 24h format (default: 17)

**chats**
- `customerEmail`: Stores email when customer provides it
- `customerPhone`: Stores phone when customer provides it
- `messageCount`: Total messages in conversation
- `escalated`: 1 if conversation was escalated to human
- `resolved`: 1 if conversation was resolved by bot
- `afterHours`: 1 if chat started outside business hours or on weekend

**chat_conversions**
- Tracks orders attributed to chatbot conversations
- Links chat ID to Shopify order
- Stores order amount and currency
- Records attribution window (24h default)

**chat_messages**
- Stores all messages for analytics
- Used for "top questions" feature

## How It Works

### 1. Email/Phone Collection

The chatbot naturally asks for email or phone when users inquire about orders:
- "Where is my order?" → "What's your email?"
- Uses `lookupOrderByEmail` or `lookupOrderByPhone` tools

Currently, you need to manually update the chat record with the email/phone. Future enhancement: auto-extract from tool calls.

### 2. Conversion Detection

Run the cron job to check for conversions:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://your-domain.com/api/cron/check-conversions
```

The job:
- Finds chats from last 24 hours with email/phone
- Queries Shopify for orders from those contacts
- Attributes orders that occurred after the chat (within 24h window)
- Creates `chat_conversions` records

### 3. Dashboard Analytics

View metrics at:
- Per-client: `/{orgId}/dashboard`
- Overall: `/dashboard`

Metrics include:
- Revenue generated from chatbot
- Top questions and responses
- Number of conversations handled
- Messages resolved vs. escalated
- Conversion rates
- Client breakdowns

## Setup Instructions

### 1. Environment Variables

Add to `.env`:
```
CRON_SECRET=your-secure-random-string
```

### 2. Run Migrations

Already done if you ran:
```bash
bun run drizzle-kit generate
bun run drizzle-kit migrate
```

### 3. Set Up Cron Job

**Option A: Vercel Cron (Recommended)**

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-conversions",
    "schedule": "0 * * * *"
  }]
}
```

**Option B: External Cron Service**

Use a service like:
- Upstash Qstash
- Cron-job.org
- Your own server

Schedule hourly requests to:
```
GET /api/cron/check-conversions
Header: Authorization: Bearer YOUR_CRON_SECRET
```

### 4. Testing

Manually trigger the cron job:
```bash
curl -H "Authorization: Bearer dev-secret" \
  http://localhost:3000/api/cron/check-conversions
```

## Tools Available

The chatbot now has these Shopify tools:
- `lookupOrderByEmail` - Find orders by email
- `lookupOrderByPhone` - Find orders by phone
- `lookupOrderByNumber` - Find order by number (#1001)
- `getProduct` - Get product details
- `listProducts` - List available products

## Tracking Escalations

To mark a conversation as escalated (when bot asks user to contact human support):

```typescript
await db.update(chats)
  .set({ escalated: 1 })
  .where(eq(chats.id, chatId));
```

To mark as resolved:

```typescript
await db.update(chats)
  .set({ resolved: 1 })
  .where(eq(chats.id, chatId));
```

## After-Hours Tracking

The system automatically tracks conversations that occur outside business hours:

### How It Works

1. Each organization has configurable:
   - Timezone (default: Europe/London)
   - Business hours start (default: 9 AM)
   - Business hours end (default: 5 PM)

2. When a chat is created:
   - System checks current time in store's timezone
   - Marks chat as `afterHours = 1` if:
     - Hour is before business start OR after business end
     - Day is Saturday or Sunday

3. Dashboard shows:
   - Total after-hours conversations
   - After-hours percentage
   - Demonstrates 24/7 chatbot value

### Configuring Business Hours

1. Go to organization settings
2. Edit organization
3. Set:
   - Timezone from dropdown
   - Business hours start (0-23)
   - Business hours end (0-23)

## Future Enhancements

1. Auto-extract email/phone from AI tool calls
2. Real-time Shopify webhooks for instant conversion tracking
3. UTM parameters in product links for precise attribution
4. Custom attribution windows per client
5. A/B testing support
6. Customer journey visualization
7. Holiday calendar support for after-hours tracking

