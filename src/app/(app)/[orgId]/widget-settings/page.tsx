import { WidgetCustomizer } from "@/components/chat/widget-customizer";
import { db } from "@/db";
import { organizations, chats } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function WidgetSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!organization) {
    notFound();
  }

  const [latestChat] = await db
    .select()
    .from(chats)
    .where(eq(chats.organizationId, orgId))
    .orderBy(desc(chats.updatedAt))
    .limit(1);

  return (
    <div className="container mx-auto py-6">
      <WidgetCustomizer orgId={orgId} chat={latestChat || null} />
    </div>
  );
}
