import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const config = {
      cloudinaryConfigured: {
        client: {
          cloudName: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
          cloudNameValue: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'not set',
          uploadPresetValue: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'not set'
        },
        server: {
          cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: !!process.env.CLOUDINARY_API_KEY,
          apiSecret: !!process.env.CLOUDINARY_API_SECRET,
          cloudNameValue: process.env.CLOUDINARY_CLOUD_NAME || 'not set',
          apiKeyValue: process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'not set',
          apiSecretValue: process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'not set'
        }
      },
      b2Configured: {
        bucketName: !!process.env.B2_BUCKET_NAME,
        region: !!process.env.B2_BUCKET_REGION,
        keyId: !!process.env.B2_APPLICATION_KEY_ID,
        key: !!process.env.B2_APPLICATION_KEY,
        bucketNameValue: process.env.B2_BUCKET_NAME || 'not set',
        regionValue: process.env.B2_BUCKET_REGION || 'not set'
      },
      supabaseConfigured: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set'
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Environment configuration check',
      config,
      recommendations: {
        cloudinary: {
          client: config.cloudinaryConfigured.client.cloudName && config.cloudinaryConfigured.client.uploadPreset 
            ? '✅ Client Cloudinary configuration is complete' 
            : '❌ Missing client Cloudinary configuration (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)',
          server: config.cloudinaryConfigured.server.cloudName && config.cloudinaryConfigured.server.apiKey && config.cloudinaryConfigured.server.apiSecret
            ? '✅ Server Cloudinary configuration is complete'
            : '❌ Missing server Cloudinary configuration (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)'
        },
        b2: config.b2Configured.bucketName && config.b2Configured.region && config.b2Configured.keyId && config.b2Configured.key
          ? '✅ B2 configuration is complete'
          : '❌ Missing B2 configuration (B2_BUCKET_NAME, B2_BUCKET_REGION, B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY)',
        supabase: config.supabaseConfigured.url && config.supabaseConfigured.anonKey && config.supabaseConfigured.serviceRoleKey
          ? '✅ Supabase configuration is complete'
          : '⚠️ Supabase configuration is optional (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)'
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
