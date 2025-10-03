'use client';

import { useState, useEffect } from 'react';
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

interface WidgetChatProps {
    orgId: string;
    chatId: string;
}

export function WidgetChat({ orgId, chatId }: WidgetChatProps) {
    const [input, setInput] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);

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

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 relative h-full">
            <div className="flex flex-col h-full">
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
            </div>
        </div>
    );
}

