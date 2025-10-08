'use client';

import { WebsiteWidget } from '@/components/chat/website-widget';
import './widget-page.css';
import { use, useEffect, useState } from 'react';
import type { WidgetCustomization } from '@/lib/widget/defaults';

export default function ChatPage({
    params,
}: {
    params: Promise<{ orgId: string; chatId: string }>;
}) {
    const { orgId, chatId } = use(params);
    const [customization, setCustomization] = useState<WidgetCustomization | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCustomization = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/organizations/${orgId}/widget-settings`);
                if (response.ok) {
                    const data = await response.json();
                    setCustomization(data);
                }
            } catch (error) {
                console.error('Failed to load widget customization:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomization();
    }, [orgId]);

    return (
        <WebsiteWidget 
            orgId={orgId} 
            chatId={chatId} 
            customization={customization}
            isLoading={isLoading}
        />
    );
}

