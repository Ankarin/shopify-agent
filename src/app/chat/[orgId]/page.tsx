"use client";

import { WebsiteWidget } from "@/components/chat/website-widget";
import { use, useEffect } from "react";
import "./[chatId]/widget-page.css";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ orgId: string }>;
}

const Page = ({ params }: PageProps) => {
  const { orgId } = use(params);
  const router = useRouter();
  const isLoading = true;

  // biome-ignore lint/correctness/useExhaustiveDependencies: false positive
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const storageKey = `widget-chat-${orgId}`;
        let existingChatId = localStorage.getItem(storageKey);

        if (!existingChatId) {
          const response = await fetch(`/api/chat/${orgId}`, {
            method: "POST",
          });

          if (!response.ok) {
            throw new Error("Failed to create chat");
          }

          const newChat = await response.json();
          existingChatId = newChat.id;

          if (existingChatId) {
            localStorage.setItem(storageKey, existingChatId);
          }
        }

        router.push(`/chat/${orgId}/${existingChatId}`);
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initializeChat();
  }, [orgId]);

  return <WebsiteWidget orgId={orgId} chatId={""} isLoading={isLoading} />;
};

export default Page;
