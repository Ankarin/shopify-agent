"use client";

import { use, useEffect, useState } from "react";
import { ChatSection } from "@/components/chat/chat-section";
import { DEFAULT_WIDGET_CONFIG, type WidgetCustomization } from "@/lib/widget/defaults";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ChatPage({
    params,
}: {
    params: Promise<{ orgId: string; chatId: string }>;
}) {
    const { orgId, chatId } = use(params);
    const router = useRouter();
    const [loadedCustomization, setLoadedCustomization] = useState<WidgetCustomization | null>(null);
    const [currentChatId, setCurrentChatId] = useState(chatId);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setCurrentChatId(chatId);
    }, [chatId]);

    useEffect(() => {
        const fetchCustomization = async () => {
            try {
                const response = await fetch(`/api/organizations/${orgId}/widget-settings`);
                if (response.ok) {
                    const data = await response.json();
                    setLoadedCustomization(data);
                }
            } catch (error) {
                console.error("Failed to load widget customization:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomization();
    }, [orgId]);

    const handleChatIdChange = (newChatId: string) => {
        setCurrentChatId(newChatId);
        router.push(`/${orgId}/dashboard/chats/${newChatId}`);
        window.dispatchEvent(new CustomEvent('chatCreated', { detail: { chatId: newChatId } }));
    };

    const config: Required<Omit<WidgetCustomization, "logoKey">> = {
        primaryColor: loadedCustomization?.primaryColor || DEFAULT_WIDGET_CONFIG.primaryColor,
        backgroundColor: loadedCustomization?.backgroundColor || DEFAULT_WIDGET_CONFIG.backgroundColor,
        secondaryColor: loadedCustomization?.secondaryColor || DEFAULT_WIDGET_CONFIG.secondaryColor,
        textPrimaryColor: loadedCustomization?.textPrimaryColor || DEFAULT_WIDGET_CONFIG.textPrimaryColor,
        textSecondaryColor: loadedCustomization?.textSecondaryColor || DEFAULT_WIDGET_CONFIG.textSecondaryColor,
        borderColor: loadedCustomization?.borderColor || DEFAULT_WIDGET_CONFIG.borderColor,
        logoUrl: loadedCustomization?.logoUrl || DEFAULT_WIDGET_CONFIG.logoUrl,
        logoWidth: loadedCustomization?.logoWidth || DEFAULT_WIDGET_CONFIG.logoWidth,
        logoHeight: loadedCustomization?.logoHeight || DEFAULT_WIDGET_CONFIG.logoHeight,
        logoBorderRadius: loadedCustomization?.logoBorderRadius || DEFAULT_WIDGET_CONFIG.logoBorderRadius,
        headerTitle: loadedCustomization?.headerTitle || DEFAULT_WIDGET_CONFIG.headerTitle,
        headerSubtitle: loadedCustomization?.headerSubtitle || DEFAULT_WIDGET_CONFIG.headerSubtitle,
        inputPlaceholder: loadedCustomization?.inputPlaceholder || DEFAULT_WIDGET_CONFIG.inputPlaceholder,
        initialMessage: loadedCustomization?.initialMessage || DEFAULT_WIDGET_CONFIG.initialMessage,
        showBranding: loadedCustomization?.showBranding !== undefined ? loadedCustomization.showBranding : DEFAULT_WIDGET_CONFIG.showBranding,
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: config.backgroundColor }}>
            <div
                className="flex items-center justify-between p-4 border-b flex-shrink-0"
                style={{
                    backgroundColor: config.secondaryColor,
                    borderColor: config.borderColor,
                }}
            >
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${orgId}/dashboard`)}
                        style={{ color: config.textPrimaryColor }}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    {config.logoUrl && (
                        <Image
                            src={config.logoUrl}
                            alt="Company Logo"
                            width={config.logoWidth}
                            height={config.logoHeight}
                            className="object-contain"
                            style={{ borderRadius: `${config.logoBorderRadius}px` }}
                        />
                    )}
                    <div>
                        <h1 className="text-lg font-semibold" style={{ color: config.textPrimaryColor }}>
                            {config.headerTitle}
                        </h1>
                        <p className="text-sm opacity-70" style={{ color: config.textPrimaryColor }}>
                            {config.headerSubtitle}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col px-6 pt-6 pb-4">
                <ChatSection
                    chatId={currentChatId}
                    orgId={orgId}
                    config={config}
                    onChatIdChange={handleChatIdChange}
                    isInternalView={true}
                />
            </div>
        </div>
    );
}

