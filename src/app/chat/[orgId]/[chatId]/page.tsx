'use client';

import { WebsiteWidget } from '@/components/chat/website-widget';
import './widget-page.css';
import { use } from 'react';

export default function ChatPage({
    params,
}: {
    params: Promise<{ orgId: string; chatId: string }>;
}) {
    const { orgId, chatId } = use(params);

    return <WebsiteWidget orgId={orgId} chatId={chatId} />;
}

