'use client';

import { WebsiteWidget } from '@/components/chat/website-widget';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ChatPage({
    params,
}: {
    params: Promise<{ orgId: string; chatId: string }>;
}) {
    const [orgId, setOrgId] = useState('');
    const [chatId, setChatId] = useState('');

    useEffect(() => {
        params.then((p) => {
            setOrgId(p.orgId);
            setChatId(p.chatId);
        });
    }, [params]);

    const handlePreview = () => {
        window.open(`/chat/${orgId}/${chatId}`, '_blank');
    };

    // Don't render widget until parameters are loaded
    if (!orgId || !chatId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    return (
        <div className="relative h-full">
            <div className="absolute top-6 left-6 z-[60]">
                <Button
                    variant="default"
                    onClick={handlePreview}
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview Widget
                </Button>
            </div>
            <WebsiteWidget orgId={orgId} chatId={chatId} />
        </div>
    );
}

