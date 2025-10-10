"use client";

import dynamic from 'next/dynamic';
import { use, useEffect, useState } from "react";
import "./[chatId]/widget-page.css";
import { CHAT_NOT_CREATED } from "@/lib/chat/constants";

const WebsiteWidget = dynamic(
  () => import('@/components/chat/website-widget').then(mod => mod.WebsiteWidget),
  { ssr: false }
);

interface PageProps {
  params: Promise<{ orgId: string }>;
}

const Page = ({ params }: PageProps) => {
  const { orgId } = use(params);
  const [chatId, setChatId] = useState<string>(CHAT_NOT_CREATED);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = `widget-chat-${orgId}`;
      const existingChatId = localStorage.getItem(storageKey);

      if (existingChatId) {
        setChatId(existingChatId);
      }

      setMounted(true);
    }
  }, [orgId]);

  if (!mounted) return null;

  return (
    <WebsiteWidget
      orgId={orgId}
      chatId={chatId}
    />
  );
};

export default Page;
