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

  // Notify parent window about widget state changes
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "widget-resize",
          isOpen,
          // Send dimensions for parent to adjust iframe
          width: isOpen ? 500 : 100,
          height: isOpen ? 780 : 100,
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
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-[420px] h-[650px] rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300"
          style={{
            backgroundColor: config.backgroundColor,
            color: config.textPrimaryColor,
          }}
        >
          <div
            className="flex items-center justify-between p-4 rounded-t-2xl"
            style={{
              backgroundColor: config.secondaryColor,
              borderBottom: `1px solid ${config.borderColor}`,
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
              className="h-7 w-7 rounded-full"
              onClick={() => setIsOpen(false)}
              style={{
                color: config.textPrimaryColor,
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div
            className="flex-1 overflow-hidden flex flex-col p-5 rounded-b-2xl"
            style={{ backgroundColor: config.backgroundColor }}
          >
            <ChatSection
              key={currentChatId}
              chatId={currentChatId}
              orgId={orgId}
              config={config}
              onChatIdChange={setCurrentChatId}
            />
          </div>
        </div>
      )}

      <Button
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        size="lg"
        disabled={isLoading}
        className="fixed bottom-4 right-6 h-16 w-16 rounded-full hover:scale-110 z-50 transition-all duration-300"
        style={{
          backgroundColor: config.primaryColor,
          color: config.textSecondaryColor,
          boxShadow: "none",
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full aspect-square h-6 w-6 border-2 border-current border-t-transparent" />
        ) : isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>
    </>
  );
}
