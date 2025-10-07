import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseClient } from '@/configs/supabase-client';

const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'widgets';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (only images)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    
    // Upload to Supabase Storage
    const { error } = await supabaseClient.storage
      .from(bucketName)
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Generate signed URL valid for 1 day (86400 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from(bucketName)
      .createSignedUrl(uniqueFilename, 86400); // 1 day = 86400 seconds

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      url: signedUrlData.signedUrl,
      filename: uniqueFilename 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
