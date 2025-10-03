'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
    PromptInput,
    PromptInputAttachment,
    PromptInputAttachments,
    PromptInputBody,
    type PromptInputMessage,
    PromptInputSubmit,
    PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import { Response } from '@/components/ai-elements/response';
import { Loader } from '@/components/ai-elements/loader';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';

interface WebsiteWidgetProps {
    orgId: string;
    chatId: string;
}

export function WebsiteWidget({ orgId, chatId }: WebsiteWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status, setMessages } = useChat({
        id: chatId,
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest: ({ messages, id }) => {
                return {
                    body: {
                        message: messages[messages.length - 1],
                        id,
                    },
                };
            },
        }),
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
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
                console.error('Failed to initialize chat:', error);
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
            text: message.text || 'Sent with attachments',
            files: message.files,
        });
        setInput('');
    };

    return (
        <>
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col z-50">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold">Chat Support</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col p-4">
                        {!isInitialized ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader />
                            </div>
                        ) : (
                            <>
                                <Conversation className="flex-1">
                                    <ConversationContent>
                                        {messages.map((message) => (
                                            <div key={message.id}>
                                                {message.parts.map((part, i) => {
                                                    if (part.type === 'text') {
                                                        return (
                                                            <Message key={`${message.id}-${i}`} from={message.role}>
                                                                <MessageContent>
                                                                    <Response>{part.text}</Response>
                                                                </MessageContent>
                                                            </Message>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        ))}
                                        {status === 'submitted' && <Loader />}
                                        <div ref={messagesEndRef} />
                                    </ConversationContent>
                                    <ConversationScrollButton />
                                </Conversation>

                                <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
                                    <PromptInputBody>
                                        <PromptInputAttachments>
                                            {(attachment) => <PromptInputAttachment data={attachment} />}
                                        </PromptInputAttachments>
                                        <div className="flex items-end gap-2">
                                            <PromptInputTextarea
                                                onChange={(e) => setInput(e.target.value)}
                                                value={input}
                                                className="flex-1"
                                                disabled={status === 'submitted' || status === 'streaming'}
                                            />
                                            <PromptInputSubmit disabled={!input || status === 'submitted' || status === 'streaming'} status={status} />
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
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </Button>
        </>
    );
}

