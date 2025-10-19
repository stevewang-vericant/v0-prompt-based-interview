import { NextResponse } from 'next/server'

export async function GET() {
  const config = {
    endpoint: process.env.B2_ENDPOINT ? '✅ Set' : '❌ Missing',
    region: process.env.B2_REGION ? '✅ Set' : '❌ Missing',
    accessKey: process.env.B2_ACCESS_KEY_ID ? '✅ Set (first 4 chars: ' + process.env.B2_ACCESS_KEY_ID?.substring(0, 4) + '...)' : '❌ Missing',
    secretKey: process.env.B2_SECRET_ACCESS_KEY ? '✅ Set (length: ' + process.env.B2_SECRET_ACCESS_KEY?.length + ' chars)' : '❌ Missing',
    bucket: process.env.B2_BUCKET_NAME || '❌ Missing',
    nodeVersion: process.version,
    platform: process.platform,
  }
  
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

