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

const ToolDisplay = ({ part }: { part: any }) => {
    const toolName = part.type?.replace('tool-', '');

    const getToolMessage = (toolName: string, state: string) => {
        const messages: Record<string, Record<string, string>> = {
            lookupOrderByEmail: {
                'input-streaming': 'Looking up orders by email...',
                'input-available': 'Looking up orders by email...',
                'output-available': 'Found orders',
                'output-error': 'Failed to lookup orders',
            },
            lookupOrderByNumber: {
                'input-streaming': 'Looking up order...',
                'input-available': 'Looking up order...',
                'output-available': 'Found order',
                'output-error': 'Failed to lookup order',
            },
            getProduct: {
                'input-streaming': 'Getting product details...',
                'input-available': 'Getting product details...',
                'output-available': 'Found product',
                'output-error': 'Failed to get product',
            },
            listProducts: {
                'input-streaming': 'Getting product list...',
                'input-available': 'Getting product list...',
                'output-available': 'Found products',
                'output-error': 'Failed to list products',
            },
        };

        return messages[toolName]?.[state] || `${toolName} ${state}`;
    };

    const message = getToolMessage(toolName, part.state);

    switch (part.state) {
        case 'input-streaming':
        case 'input-available':
            return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    {message}
                </div>
            );
        case 'output-available':
            return (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 py-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    ✓ {message}
                </div>
            );
        case 'output-error':
            return (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 py-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    ✗ {message}
                </div>
            );
        default:
            return null;
    }
};

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
                console.log('🚀 [Widget] Sending message:', {
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
            console.log('✅ [Widget] Message finished:', message);
        },
        onError: (error) => {
            console.error('❌ [Widget] Error:', error);
        },
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
                                        {messages.map((message) => {
                                            console.log('🔍 [Widget] Rendering message:', {
                                                id: message.id,
                                                role: message.role,
                                                partsCount: message.parts?.length,
                                                parts: message.parts,
                                            });
                                            return (
                                                <Message key={message.id} from={message.role}>
                                                    <MessageContent>
                                                        {message.parts?.map((part: any, i: number) => {
                                                            switch (part.type) {
                                                                case 'text':
                                                                    return (
                                                                        <Response key={`${message.id}-${i}`}>
                                                                            {part.text}
                                                                        </Response>
                                                                    );
                                                                default:
                                                                    if (part.type?.startsWith('tool-')) {
                                                                        return (
                                                                            <ToolDisplay
                                                                                key={`${message.id}-${i}`}
                                                                                part={part}
                                                                            />
                                                                        );
                                                                    }
                                                                    return null;
                                                            }
                                                        })}
                                                    </MessageContent>
                                                </Message>
                                            );
                                        })}
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

