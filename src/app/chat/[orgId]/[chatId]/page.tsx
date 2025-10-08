import { WebsiteWidget } from '@/components/chat/website-widget';
import './widget-page.css';

export default async function ChatPage({
    params,
}: {
    params: Promise<{ orgId: string; chatId: string }>;
}) {
    const { orgId, chatId } = await params;

    return <WebsiteWidget orgId={orgId} chatId={chatId} />;
}

