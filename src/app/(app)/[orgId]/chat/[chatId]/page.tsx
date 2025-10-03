'use client';

import { WidgetChat } from '@/components/chat/widget-chat';

export default async function ChatPage({
    params,
}: {
    params: Promise<{ orgId: string; chatId: string }>;
}) {
    const { orgId, chatId } = await params;

    return <WidgetChat orgId={orgId} chatId={chatId} />;
}

