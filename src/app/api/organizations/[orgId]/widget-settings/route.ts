import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { widgetSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_WIDGET_CONFIG } from '@/lib/widget/defaults';
import { supabaseClient } from '@/configs/supabase-client';

const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'widgets';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    const settings = await db
      .select()
      .from(widgetSettings)
      .where(eq(widgetSettings.organizationId, orgId))
      .limit(1);

    if (settings.length === 0) {
      // Return default settings if not found (shadcn theme colors)
      return NextResponse.json(DEFAULT_WIDGET_CONFIG);
    }

    const setting = settings[0];

    // If logoKey exists, generate a fresh signed URL
    if (setting.logoKey) {
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
        .from(bucketName)
        .createSignedUrl(setting.logoKey, 86400); // 1 day = 86400 seconds

      if (!signedUrlError && signedUrlData) {
        // Add logoUrl to response (not stored in DB, generated on-the-fly)
        return NextResponse.json({
          ...setting,
          logoUrl: signedUrlData.signedUrl,
        });
      }
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error fetching widget settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget settings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const body = await request.json();

    // Remove timestamp fields from body as they're managed by the database
    const { createdAt: _createdAt, updatedAt: _updatedAt, id: _id, ...settingsData } = body;

    // Check if settings exist
    const existing = await db
      .select()
      .from(widgetSettings)
      .where(eq(widgetSettings.organizationId, orgId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing settings
      const updated = await db
        .update(widgetSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(widgetSettings.organizationId, orgId))
        .returning();

      return NextResponse.json(updated[0]);
    } else {
      // Create new settings
      const created = await db
        .insert(widgetSettings)
        .values({
          organizationId: orgId,
          ...settingsData,
        })
        .returning();

      return NextResponse.json(created[0]);
    }
  } catch (error) {
    console.error('Error saving widget settings:', error);
    return NextResponse.json(
      { error: 'Failed to save widget settings' },
      { status: 500 }
    );
  }
}
