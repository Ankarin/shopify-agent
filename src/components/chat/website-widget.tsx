"use client";

import { useState, useEffect, useRef } from "react";
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

interface WebsiteWidgetProps {
  orgId: string;
  chatId: string;
}

interface MessagePart {
  type: string;
  text?: string;
}

export function WebsiteWidget({ orgId, chatId }: WebsiteWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isInitialized && isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isInitialized, isOpen]);

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
                <MessageContent>
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
        <div className="fixed bottom-24 right-6 w-[420px] h-[650px] bg-background border rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <div>
                <h3 className="font-semibold text-base">Chat Support</h3>
                <p className="text-xs text-muted-foreground">
                  We reply instantly
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-background/80"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col p-5 bg-gradient-to-b from-background to-muted/20">
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
                  className="mt-4 bg-background/50 backdrop-blur-sm border rounded-xl shadow-sm"
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
                        placeholder="What would you like to know?"
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
