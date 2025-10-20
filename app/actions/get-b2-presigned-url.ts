"use server"

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
  region: process.env.B2_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true,
})

/**
 * 生成 B2 预签名 URL，允许客户端直接上传文件
 * 
 * @param filename 文件名（包含路径）
 * @param contentType 文件类型
 * @returns 预签名 URL 和公开 URL
 */
export async function getB2PresignedUrl(
  filename: string,
  contentType: string
): Promise<{
  success: boolean
  presignedUrl?: string
  publicUrl?: string
  error?: string
}> {
  try {
    console.log("[B2] Generating presigned URL for:", filename)
    
    if (!process.env.B2_BUCKET_NAME) {
      throw new Error("B2_BUCKET_NAME not configured")
    }

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: filename,
      ContentType: contentType,
    })

    // 生成预签名 URL，有效期 15 分钟
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    })

    const publicUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${filename}`

    console.log("[B2] ✓ Presigned URL generated successfully")
    
    return {
      success: true,
      presignedUrl,
      publicUrl,
    }
  } catch (error) {
    console.error("[B2] Error generating presigned URL:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate presigned URL",
    }
  }
}

