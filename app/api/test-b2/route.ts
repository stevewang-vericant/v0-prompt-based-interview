import { NextResponse } from 'next/server'

export async function GET() {
  const region = process.env.B2_BUCKET_REGION
  const endpoint = region ? `https://s3.${region}.backblazeb2.com` : '❌ Missing region'
  
  const config = {
    bucketRegion: process.env.B2_BUCKET_REGION ? '✅ Set: ' + process.env.B2_BUCKET_REGION : '❌ Missing',
    bucketName: process.env.B2_BUCKET_NAME ? '✅ Set: ' + process.env.B2_BUCKET_NAME : '❌ Missing',
    applicationKeyId: process.env.B2_APPLICATION_KEY_ID ? '✅ Set (first 4 chars: ' + process.env.B2_APPLICATION_KEY_ID?.substring(0, 4) + '...)' : '❌ Missing',
    applicationKey: process.env.B2_APPLICATION_KEY ? '✅ Set (length: ' + process.env.B2_APPLICATION_KEY?.length + ' chars)' : '❌ Missing',
    calculatedEndpoint: endpoint,
    nodeVersion: process.version,
    platform: process.platform,
  }
  
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

