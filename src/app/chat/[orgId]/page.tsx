"use client";

import dynamic from 'next/dynamic';
import { use, useEffect } from "react";
import "./[chatId]/widget-page.css";
import { CHAT_NOT_CREATED } from "@/lib/chat/constants";
import { useRouter } from "next/navigation";

const WebsiteWidget = dynamic(
  () => import('@/components/chat/website-widget').then(mod => mod.WebsiteWidget),
  { ssr: false }
);

interface PageProps {
  params: Promise<{ orgId: string }>;
}

const Page = ({ params }: PageProps) => {
  const { orgId } = use(params);
  const router = useRouter();

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
    />
  );
};

export default Page;
