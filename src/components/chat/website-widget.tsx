"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import {
  DEFAULT_WIDGET_CONFIG,
  type WidgetCustomization,
} from "@/lib/widget/defaults";
import { ChatSection } from "./chat-section";

interface WebsiteWidgetProps {
  orgId: string;
  chatId: string;
  customization?: WidgetCustomization;
  isLoading?: boolean;
}

export function WebsiteWidget({
  orgId,
  chatId,
  customization,
  isLoading = false,
}: WebsiteWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadedCustomization, setLoadedCustomization] =
    useState<WidgetCustomization | null>(null);
  const [currentChatId, setCurrentChatId] = useState(chatId);

  useEffect(() => {
    console.log('[Widget] Component mounted', {
      isLoading,
      isOpen,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      windowSize: typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : null
    });
  }, []);

  useEffect(() => {
    console.log('[Widget] Button visibility:', {
      shouldShowButton: !isOpen,
      isLoading,
      isOpen
    });
  }, [isOpen, isLoading]);

  // Update currentChatId when chatId prop changes
  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);

  // Notify parent window about widget state changes
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "widget-resize",
          isOpen,
        },
        "*",
      );
    }
  }, [isOpen]);

  // Load customization from API if not provided via props
  useEffect(() => {
    if (!customization) {
      const fetchCustomization = async () => {
        try {
          const response = await fetch(
            `/api/organizations/${orgId}/widget-settings`,
          );
          if (response.ok) {
            const data = await response.json();
            setLoadedCustomization(data);
          }
        } catch (error) {
          console.error("Failed to load widget customization:", error);
        }
      };
      fetchCustomization();
    }
  }, [orgId, customization]);

  // Defaults for customization (use props or loaded from API)
  const activeCustomization = customization || loadedCustomization;

  const config: Required<Omit<WidgetCustomization, "logoKey">> = {
    primaryColor:
      activeCustomization?.primaryColor || DEFAULT_WIDGET_CONFIG.primaryColor,
    backgroundColor:
      activeCustomization?.backgroundColor ||
      DEFAULT_WIDGET_CONFIG.backgroundColor,
    secondaryColor:
      activeCustomization?.secondaryColor ||
      DEFAULT_WIDGET_CONFIG.secondaryColor,
    textPrimaryColor:
      activeCustomization?.textPrimaryColor ||
      DEFAULT_WIDGET_CONFIG.textPrimaryColor,
    textSecondaryColor:
      activeCustomization?.textSecondaryColor ||
      DEFAULT_WIDGET_CONFIG.textSecondaryColor,
    borderColor:
      activeCustomization?.borderColor || DEFAULT_WIDGET_CONFIG.borderColor,
    logoUrl: activeCustomization?.logoUrl || DEFAULT_WIDGET_CONFIG.logoUrl,
    logoWidth:
      activeCustomization?.logoWidth || DEFAULT_WIDGET_CONFIG.logoWidth,
    logoHeight:
      activeCustomization?.logoHeight || DEFAULT_WIDGET_CONFIG.logoHeight,
    logoBorderRadius:
      activeCustomization?.logoBorderRadius ||
      DEFAULT_WIDGET_CONFIG.logoBorderRadius,
    headerTitle:
      activeCustomization?.headerTitle || DEFAULT_WIDGET_CONFIG.headerTitle,
    headerSubtitle:
      activeCustomization?.headerSubtitle ||
      DEFAULT_WIDGET_CONFIG.headerSubtitle,
    inputPlaceholder:
      activeCustomization?.inputPlaceholder ||
      DEFAULT_WIDGET_CONFIG.inputPlaceholder,
    showBranding:
      activeCustomization?.showBranding !== undefined
        ? activeCustomization.showBranding
        : DEFAULT_WIDGET_CONFIG.showBranding,
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed bottom-0 right-0 md:bottom-24 md:right-6 w-full h-full md:w-[420px] md:h-[650px] md:rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300"
          style={{
            backgroundColor: config.backgroundColor,
            color: config.textPrimaryColor,
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingTop: 'env(safe-area-inset-top)',
            pointerEvents: 'auto',
          }}
        >
          <div
            className="flex items-center justify-between p-4 md:rounded-t-2xl"
            style={{
              backgroundColor: config.secondaryColor,
              borderBottom: `1px solid ${config.borderColor}`,
              paddingTop: 'max(1rem, env(safe-area-inset-top))',
            }}
          >
            <div className="flex items-center gap-2.5">
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
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <div>
                <h3
                  className="font-semibold text-base"
                  style={{ color: config.textPrimaryColor }}
                >
                  {config.headerTitle}
                </h3>
                <p
                  className="text-xs opacity-70"
                  style={{ color: config.textPrimaryColor }}
                >
                  {config.headerSubtitle}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-black/5"
              onClick={() => setIsOpen(false)}
              style={{
                color: config.textPrimaryColor,
              }}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div
            className="flex-1 overflow-hidden flex flex-col p-5"
            style={{
              backgroundColor: config.backgroundColor,
            }}
          >
            <ChatSection
              key={currentChatId}
              chatId={currentChatId}
              orgId={orgId}
              config={config}
              onChatIdChange={setCurrentChatId}
            />
          </div>

          {config.showBranding && (
            <div
              className="flex items-center justify-center py-2 px-4 text-xs md:rounded-b-2xl"
              style={{
                backgroundColor: config.secondaryColor,
                borderTop: `1px solid ${config.borderColor}`,
                color: config.textPrimaryColor,
                opacity: 0.7,
                paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
              }}
            >
              Powered By{" "}
              <a
                href="https://www.sevensocials.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 font-medium hover:underline"
                style={{ color: config.textPrimaryColor }}
              >
                Sevensocials
              </a>
            </div>
          )}
        </div>
      )}

      {!isOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            WebkitTransform: "translate(-50%, -50%)",
            zIndex: 999999,
          }}
        >
          <button
            onClick={() => !isLoading && setIsOpen(true)}
            disabled={isLoading}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: config.primaryColor,
              color: config.textSecondaryColor,
              border: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <div style={{
                width: "24px",
                height: "24px",
                border: "2px solid currentColor",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
            ) : (
              <MessageSquare style={{ width: "28px", height: "28px" }} />
            )}
          </button>
        </div>
      )}
    </>
  );
}
