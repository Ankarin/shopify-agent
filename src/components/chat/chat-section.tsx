"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import type { WidgetCustomization } from "@/lib/widget/defaults";
import { CHAT_NOT_CREATED } from "@/lib/chat/constants";
import { PreChatForm } from "./pre-chat-form";
import { getFromStorage, setToStorage, removeFromStorage } from "@/lib/utils/storage";

interface MessagePart {
  type: string;
  text?: string;
}

interface ChatSectionProps {
  chatId: string;
  orgId: string;
  config: Required<Omit<WidgetCustomization, "logoKey">>;
  onChatIdChange: (newChatId: string) => void;
  isInternalView?: boolean;
}

interface CustomerInfo {
  name: string;
  email: string;
}

export function ChatSection({
  chatId,
  orgId,
  config,
  onChatIdChange,
  isInternalView = false,
}: ChatSectionProps) {
  const [input, setInput] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [showPreChatForm, setShowPreChatForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const justCreatedChatRef = useRef(false);
  const pendingMessageProcessedRef = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
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
    [],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatId,
    transport,
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
    setIsInitialized(false);
    setMessages([]);
    pendingMessageProcessedRef.current = false;

    const initializeChat = async () => {
      console.log("🔄 [ChatSection] Initializing chat:", {
        chatId,
        orgId,
        chatIdType: typeof chatId,
        orgIdType: typeof orgId,
        chatIdLength: chatId?.length,
        orgIdLength: orgId?.length,
      });

      if (!orgId || !chatId) {
        console.error("❌ [ChatSection] Missing orgId or chatId:", { orgId, chatId });
        setIsInitialized(true);
        return;
      }

      if (chatId === CHAT_NOT_CREATED) {
        console.log("⚠️ [ChatSection] Chat not created yet, skipping history load");
        setIsInitialized(true);
        return;
      }

      if (justCreatedChatRef.current) {
        console.log("⚠️ [ChatSection] Just created chat, skipping history load");
        justCreatedChatRef.current = false;
        setIsInitialized(true);
        return;
      }

      try {
        const url = `/api/chat/${orgId}/${chatId}`;
        console.log("📡 [ChatSection] Fetching chat history from:", url);
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ [ChatSection] Chat history loaded:", data);

          if (data.updatedAt && !isInternalView) {
            const lastUpdateTime = new Date(data.updatedAt).getTime();
            const currentTime = Date.now();
            const thirtyMinutesInMs = 30 * 60 * 1000;

            if (currentTime - lastUpdateTime > thirtyMinutesInMs) {
              console.log("⏱️ [ChatSection] Chat inactive for >30 minutes, starting new chat");
              removeFromStorage(`widget-chat-${orgId}`);
              removeFromStorage(`widget-customer-info-${orgId}-${chatId}`);
              onChatIdChange(CHAT_NOT_CREATED);
              return;
            }
          }

          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          } else if (config.initialMessage && !isInternalView) {
            setMessages([
              {
                id: `initial-${Date.now()}`,
                role: "assistant",
                parts: [{ type: "text", text: config.initialMessage }],
              },
            ]);
          }

          if (isInternalView) {
            setShowPreChatForm(false);
          } else if (data.customerName && data.customerEmail) {
            const existingCustomerInfo = {
              name: data.customerName,
              email: data.customerEmail,
            };
            setCustomerInfo(existingCustomerInfo);
            setShowPreChatForm(false);
          }
        } else {
          console.error("❌ [ChatSection] Failed to fetch chat:", response.status, response.statusText, "URL:", url);
          if (response.status === 404 || response.status === 500) {
            console.log("🧹 [ChatSection] Chat not found in DB, clearing localStorage");
            removeFromStorage(`widget-chat-${orgId}`);
            removeFromStorage(`widget-customer-info-${orgId}-${chatId}`);
            onChatIdChange(CHAT_NOT_CREATED);
          }
        }
      } catch (error) {
        console.error("❌ [ChatSection] Failed to initialize chat:", error);
        console.log("🧹 [ChatSection] Error fetching chat, clearing localStorage");
        removeFromStorage(`widget-chat-${orgId}`);
        removeFromStorage(`widget-customer-info-${orgId}-${chatId}`);
        onChatIdChange(CHAT_NOT_CREATED);
      } finally {
        setIsInitialized(true);
        console.log("✅ [ChatSection] Chat initialized");
      }
    };

    initializeChat();
  }, [orgId, chatId, setMessages, onChatIdChange]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom is stable
  useEffect(() => {
    if (isInitialized) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isInitialized]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom is stable
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log("🔍 [ChatSection] Form logic running:", { chatId, isInternalView, CHAT_NOT_CREATED });

    if (chatId === CHAT_NOT_CREATED) {
      console.log("✅ [ChatSection] New chat detected - showing form");
      setShowPreChatForm(true);
      setCustomerInfo(null);
      return;
    }

    if (isInternalView) {
      console.log("✅ [ChatSection] Internal view - hiding form");
      setShowPreChatForm(false);
      setCustomerInfo(null);
      return;
    }

    const storedInfo = getFromStorage<CustomerInfo>(`widget-customer-info-${orgId}-${chatId}`);
    if (storedInfo) {
      console.log("✅ [ChatSection] Found stored customer info");
      setCustomerInfo(storedInfo);
      setShowPreChatForm(false);
    } else {
      console.log("✅ [ChatSection] No stored info - showing form");
      setShowPreChatForm(true);
    }
  }, [orgId, chatId, isInternalView]);

  const handlePreChatFormSubmit = (data: CustomerInfo) => {
    setCustomerInfo(data);
    if (chatId !== CHAT_NOT_CREATED) {
      setToStorage(`widget-customer-info-${orgId}-${chatId}`, data);
    }
    setShowPreChatForm(false);
  };

  useEffect(() => {
    if (!showPreChatForm && messages.length === 0 && config.initialMessage && chatId === CHAT_NOT_CREATED) {
      setMessages([
        {
          id: `initial-${Date.now()}`,
          role: "assistant",
          parts: [{ type: "text", text: config.initialMessage }],
        },
      ]);
    }
  }, [showPreChatForm, messages.length, config.initialMessage, setMessages, chatId]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    if (chatId === CHAT_NOT_CREATED) {
      try {
        const response = await fetch(`/api/chat/${orgId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: customerInfo?.name,
            customerEmail: customerInfo?.email,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create chat");
        }

        const newChat = await response.json();
        const newChatId = newChat.id;

        if (customerInfo) {
          setToStorage(`widget-customer-info-${orgId}-${newChatId}`, customerInfo);
        }

        sessionStorage.setItem(
          `pending-message-${orgId}`,
          JSON.stringify(message),
        );

        justCreatedChatRef.current = true;
        setToStorage(`widget-chat-${orgId}`, newChatId);
        setInput("");
        onChatIdChange(newChatId);
        return;
      } catch (error) {
        console.error("Error creating chat or sending message:", error);
        return;
      }
    }

    sendMessage({
      text: message.text || "Sent with attachments",
      files: message.files,
    });
    setInput("");
  };

  // Check for pending messages after chat creation
  useEffect(() => {
    if (chatId !== CHAT_NOT_CREATED && isInitialized && !pendingMessageProcessedRef.current) {
      const pendingMessageKey = `pending-message-${orgId}`;
      const pendingMessageStr = sessionStorage.getItem(pendingMessageKey);

      if (pendingMessageStr) {
        try {
          const pendingMessage = JSON.parse(pendingMessageStr);
          sessionStorage.removeItem(pendingMessageKey);
          pendingMessageProcessedRef.current = true;

          if (messages.length === 0 && config.initialMessage) {
            setMessages([
              {
                id: `initial-${Date.now()}`,
                role: "assistant",
                parts: [{ type: "text", text: config.initialMessage }],
              },
            ]);
          }

          setTimeout(() => {
            sendMessage({
              text: pendingMessage.text || "Sent with attachments",
              files: pendingMessage.files,
            });
          }, 100);
        } catch (error) {
          console.error("Error processing pending message:", error);
        }
      }
    }
  }, [chatId, orgId, isInitialized, sendMessage, messages.length, config.initialMessage, setMessages]);

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
                    backgroundColor:
                      message.role === "user"
                        ? config.primaryColor
                        : config.secondaryColor,
                    color:
                      message.role === "user"
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

  console.log("🎨 [ChatSection] Rendering:", { isInitialized, showPreChatForm, chatId });

  if (!isInitialized) {
    console.log("⏳ [ChatSection] Showing loader - not initialized");
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    );
  }

  if (showPreChatForm) {
    console.log("📝 [ChatSection] Showing pre-chat form");
    return <PreChatForm config={config} onSubmit={handlePreChatFormSubmit} />;
  }

  console.log("💬 [ChatSection] Showing chat interface");

  return (
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
        className="mt-4 flex-shrink-0 backdrop-blur-sm rounded-xl shadow-sm"
        style={{
          backgroundColor: config.backgroundColor,
          border: `1px solid ${config.borderColor}`,
        }}
        globalDrop
        multiple
      >
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <div className="flex items-center gap-2 px-2">
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              className="flex-1 border-0 focus-visible:ring-0 bg-transparent resize-none"
              placeholder={config.inputPlaceholder}
              style={{ color: config.textPrimaryColor }}
              disabled={status === "submitted" || status === "streaming"}
            />
            <PromptInputSubmit
              disabled={
                !input || status === "submitted" || status === "streaming"
              }
              status={status}
              size="default"
              className="h-10 w-10 shrink-0"
              style={{
                backgroundColor: config.primaryColor,
                color: config.textSecondaryColor,
              }}
            />
          </div>
        </PromptInputBody>
      </PromptInput>
    </>
  );
}
