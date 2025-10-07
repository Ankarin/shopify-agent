"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Loader } from "@/components/ai-elements/loader";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { DEFAULT_WIDGET_CONFIG, type WidgetCustomization } from "@/lib/widget/defaults";

interface WebsiteWidgetProps {
  orgId: string;
  chatId: string;
  customization?: WidgetCustomization;
}

interface MessagePart {
  type: string;
  text?: string;
}

export function WebsiteWidget({ orgId, chatId, customization }: WebsiteWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadedCustomization, setLoadedCustomization] = useState<WidgetCustomization | null>(null);

  // Load customization from API if not provided via props
  useEffect(() => {
    if (!customization) {
      const fetchCustomization = async () => {
        try {
          const response = await fetch(`/api/organizations/${orgId}/widget-settings`);
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
    primaryColor: activeCustomization?.primaryColor || DEFAULT_WIDGET_CONFIG.primaryColor,
    backgroundColor: activeCustomization?.backgroundColor || DEFAULT_WIDGET_CONFIG.backgroundColor,
    secondaryColor: activeCustomization?.secondaryColor || DEFAULT_WIDGET_CONFIG.secondaryColor,
    textPrimaryColor: activeCustomization?.textPrimaryColor || DEFAULT_WIDGET_CONFIG.textPrimaryColor,
    textSecondaryColor: activeCustomization?.textSecondaryColor || DEFAULT_WIDGET_CONFIG.textSecondaryColor,
    borderColor: activeCustomization?.borderColor || DEFAULT_WIDGET_CONFIG.borderColor,
    logoUrl: activeCustomization?.logoUrl || DEFAULT_WIDGET_CONFIG.logoUrl,
    logoWidth: activeCustomization?.logoWidth || DEFAULT_WIDGET_CONFIG.logoWidth,
    logoHeight: activeCustomization?.logoHeight || DEFAULT_WIDGET_CONFIG.logoHeight,
    logoBorderRadius: activeCustomization?.logoBorderRadius || DEFAULT_WIDGET_CONFIG.logoBorderRadius,
    headerTitle: activeCustomization?.headerTitle || DEFAULT_WIDGET_CONFIG.headerTitle,
    headerSubtitle: activeCustomization?.headerSubtitle || DEFAULT_WIDGET_CONFIG.headerSubtitle,
    inputPlaceholder: activeCustomization?.inputPlaceholder || DEFAULT_WIDGET_CONFIG.inputPlaceholder,
  };

  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, id }) => {
        console.log("🚀 [Widget] Sending message:", {
          messageCount: messages.length,
          lastMessage: messages[messages.length - 1],
          chatId: id,
        });
        return {
          body: {
            message: messages[messages.length - 1],
            id,
          },
        };
      },
    }),
    onFinish: (message) => {
      console.log("✅ [Widget] Message finished:", message);
    },
    onError: (error) => {
      console.error("❌ [Widget] Error:", error);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await fetch(`/api/chat/${orgId}/${chatId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setIsInitialized(true);
      }
    };

    initializeChat();
  }, [orgId, chatId, setMessages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom is stable
  useEffect(() => {
    if (isInitialized && isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isInitialized, isOpen]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom is stable
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage({
      text: message.text || "Sent with attachments",
      files: message.files,
    });
    setInput("");
  };

  const renderConversationContent = () => {
    const lastMessage = messages[messages.length - 1];

    const isLastMessageEmpty =
      lastMessage?.role === "assistant" &&
      (!lastMessage.parts?.length ||
        lastMessage.parts.every(
          (part: MessagePart) =>
            part.type === "text" &&
            (!part.text || part.text.trim().length === 0),
        ));

    const shouldShowLoader =
      status === "submitted" ||
      (status === "streaming" &&
        (isLastMessageEmpty || lastMessage?.role !== "assistant"));

    return (
      <>
        {messages.map((message) => {
          console.log("🔍 [Widget] Rendering message:", {
            id: message.id,
            role: message.role,
            partsCount: message.parts?.length,
            parts: message.parts,
          });

          const hasContent = message.parts?.some(
            (part: MessagePart) =>
              part.type === "text" && part.text && part.text.trim().length > 0,
          );

          if (
            message.role === "assistant" &&
            !hasContent &&
            status === "streaming"
          ) {
            return null;
          }

          return (
            <Message key={message.id} from={message.role}>
              {hasContent && (
                <MessageContent
                  style={{
                    backgroundColor: message.role === "user" 
                      ? config.primaryColor 
                      : config.secondaryColor,
                    color: message.role === "user"
                      ? config.textSecondaryColor
                      : config.textPrimaryColor,
                  }}
                >
                  {message.parts?.map((part: MessagePart, i: number) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              )}
            </Message>
          );
        })}
        {shouldShowLoader && <Loader />}
      </>
    );
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 w-[420px] h-[650px] rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300"
          style={{ 
            backgroundColor: config.backgroundColor,
            color: config.textPrimaryColor 
          }}
        >
          <div 
            className="flex items-center justify-between p-4 rounded-t-2xl"
            style={{ 
              backgroundColor: config.secondaryColor,
              borderBottom: `1px solid ${config.borderColor}`
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
                <h3 className="font-semibold text-base" style={{ color: config.textPrimaryColor }}>
                  {config.headerTitle}
                </h3>
                <p className="text-xs opacity-70" style={{ color: config.textPrimaryColor }}>
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
                color: config.textPrimaryColor 
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col p-5 rounded-b-2xl" style={{ backgroundColor: config.backgroundColor }}>
            {!isInitialized ? (
              <div className="flex items-center justify-center h-full">
                <Loader />
              </div>
            ) : (
              <>
                <Conversation className="flex-1">
                  <ConversationContent>
                    {renderConversationContent()}
                    <div ref={messagesEndRef} />
                  </ConversationContent>
                  <ConversationScrollButton />
                </Conversation>

                <PromptInput
                  onSubmit={handleSubmit}
                  className="mt-4 backdrop-blur-sm rounded-xl shadow-sm"
                  style={{ 
                    backgroundColor: config.backgroundColor,
                    border: `1px solid ${config.borderColor}`
                  }}
                  globalDrop
                  multiple
                >
                  <PromptInputBody>
                    <PromptInputAttachments>
                      {(attachment) => (
                        <PromptInputAttachment data={attachment} />
                      )}
                    </PromptInputAttachments>
                    <div className="flex items-center gap-2 px-2">
                      <PromptInputTextarea
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        className="flex-1 border-0 focus-visible:ring-0 bg-transparent resize-none"
                        placeholder={config.inputPlaceholder}
                        style={{ color: config.textPrimaryColor }}
                        disabled={
                          status === "submitted" || status === "streaming"
                        }
                      />
                      <PromptInputSubmit
                        disabled={
                          !input ||
                          status === "submitted" ||
                          status === "streaming"
                        }
                        status={status}
                        size="default"
                        className="h-10 w-10 shrink-0"
                        style={{ 
                          backgroundColor: config.primaryColor,
                          color: config.textSecondaryColor 
                        }}
                      />
                    </div>
                  </PromptInputBody>
                </PromptInput>
              </>
            )}
          </div>
        </div>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="fixed bottom-4 right-6 h-16 w-16 rounded-full shadow-2xl hover:shadow-3xl z-50 transition-all duration-300 hover:scale-110"
        style={{ 
          backgroundColor: config.primaryColor,
          color: config.textSecondaryColor 
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>
    </>
  );
}
