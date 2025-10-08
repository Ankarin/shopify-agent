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

interface MessagePart {
  type: string;
  text?: string;
}

interface ChatSectionProps {
  chatId: string;
  orgId: string;
  config: Required<Omit<WidgetCustomization, "logoKey">>;
  onChatIdChange: (newChatId: string) => void;
}

export function ChatSection({
  chatId,
  orgId,
  config,
  onChatIdChange,
}: ChatSectionProps) {
  const [input, setInput] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (isInitialized) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isInitialized]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom is stable
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        });

        if (!response.ok) {
          throw new Error("Failed to create chat");
        }

        const newChat = await response.json();
        const newChatId = newChat.id;
        onChatIdChange(newChatId);
        localStorage.setItem(`widget-chat-${orgId}`, newChatId);

        sessionStorage.setItem(
          `pending-message-${orgId}`,
          JSON.stringify(message),
        );
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

  useEffect(() => {
    if (chatId !== CHAT_NOT_CREATED && isInitialized) {
      const pendingMessageKey = `pending-message-${orgId}`;
      const pendingMessageStr = sessionStorage.getItem(pendingMessageKey);

      if (pendingMessageStr) {
        try {
          const pendingMessage = JSON.parse(pendingMessageStr);
          sessionStorage.removeItem(pendingMessageKey);

          sendMessage({
            text: pendingMessage.text || "Sent with attachments",
            files: pendingMessage.files,
          });
        } catch (error) {
          console.error("Error processing pending message:", error);
        }
      }
    }
  }, [chatId, orgId, isInitialized, sendMessage]);

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

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    );
  }

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
        className="mt-4 backdrop-blur-sm rounded-xl shadow-sm"
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
