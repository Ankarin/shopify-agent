"use client";

import { WebsiteWidget } from "@/components/chat/website-widget";
import { use, useEffect } from "react";
import "./[chatId]/widget-page.css";
import { CHAT_NOT_CREATED } from "@/lib/chat/constants";
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
    if (typeof window !== "undefined") {
      const storageKey = `widget-chat-${orgId}`;
      const existingChatId = localStorage.getItem(storageKey);

      if (existingChatId) {
        router.replace(`/chat/${orgId}/${existingChatId}`);
      } else {
        router.replace(`/chat/${orgId}/${CHAT_NOT_CREATED}`);
      }
    }
  }, [orgId]);

  return (
    <WebsiteWidget
      orgId={orgId}
      chatId={CHAT_NOT_CREATED}
      isLoading={isLoading}
    />
  );
};

export default Page;
