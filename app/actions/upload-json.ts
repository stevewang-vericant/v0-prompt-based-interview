"use server"

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

/**
 * 上传 JSON 数据到 B2
 */
export async function uploadJsonToB2(
  jsonData: any,
  interviewId: string,
  filename: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log("[v0] ===== Starting JSON upload =====")
    console.log("[v0] Interview ID:", interviewId)
    console.log("[v0] Filename:", filename)
    
    // 检查环境变量
    if (!process.env.B2_BUCKET_NAME) {
      throw new Error("B2_BUCKET_NAME not configured")
    }
    if (!process.env.B2_BUCKET_REGION) {
      throw new Error("B2_BUCKET_REGION not configured")
    }
    if (!process.env.B2_APPLICATION_KEY_ID) {
      throw new Error("B2_APPLICATION_KEY_ID not configured")
    }
    if (!process.env.B2_APPLICATION_KEY) {
      throw new Error("B2_APPLICATION_KEY not configured")
    }

    console.log("[v0] Bucket:", process.env.B2_BUCKET_NAME)
    console.log("[v0] Region:", process.env.B2_BUCKET_REGION)

    // 初始化 S3 客户端（B2 兼容 S3 API）
    const s3Client = new S3Client({
      endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
      region: process.env.B2_BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.B2_APPLICATION_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
      },
    })

    // 转换 JSON 为 Buffer
    const jsonString = JSON.stringify(jsonData, null, 2)
    const buffer = Buffer.from(jsonString, 'utf-8')
    console.log("[v0] JSON buffer created, size:", buffer.length, "bytes")

    const timestamp = Date.now()
    const key = `interviews/${interviewId}/${filename}-${timestamp}.json`
    console.log("[v0] S3 Key:", key)

    // 上传到 B2
    console.log("[v0] Uploading to B2...")
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'application/json',
    })

    await s3Client.send(uploadCommand)
    console.log("[v0] ✓ B2 upload successful!")

    // 构建公开访问 URL
    const url = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${key}`
    console.log("[v0] JSON URL:", url)

    return {
      success: true,
      url,
    }
  } catch (error) {
    console.error("[v0] JSON upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

