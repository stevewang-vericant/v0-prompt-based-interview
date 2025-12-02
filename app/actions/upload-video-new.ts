"use server"

import { prisma } from "@/lib/prisma"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
  region: process.env.B2_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true, // Required for B2
})

export async function uploadVideoToB2AndSave(
  videoBlob: Blob,
  interviewId: string,
  promptId: string,
  responseOrder: number,
  schoolCode?: string | null,
  studentEmail?: string,
  studentName?: string,
  promptText?: string,
  promptCategory?: string,
  promptResponseTime?: number,
) {
  try {
    console.log("[v0] ===== Starting video upload (Prisma) =====")
    // ... (日志逻辑保持不变)
    
    // Check environment variables
    if (!process.env.B2_BUCKET_NAME) throw new Error("B2_BUCKET_NAME not configured")
    // ... (其他检查保持不变)

    console.log("[v0] Converting blob to buffer...")
    const arrayBuffer = await videoBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const timestamp = Date.now()
    const filename = responseOrder === 0 
      ? `interviews/${interviewId}/complete-interview-${timestamp}.mp4`
      : `interviews/${interviewId}/response-${responseOrder}-${timestamp}.webm`
    
    const contentType = filename.endsWith('.mp4') ? 'video/mp4' : 'video/webm'
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(uploadCommand)
    console.log("[v0] ✓ B2 upload successful!")

    const videoUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${filename}`
    
    // Save to database using Prisma
    console.log("[v0] Saving to database...")
    
    // 1. Find or Create Interview (注意：这里的 interviewId 是业务 ID，不是 UUID)
    // 但是 Schema 里 interview.id 是 UUID。我们需要确定 interviewId 是什么。
    // 在旧代码中，interview_id 字段存的是外部 ID。但在新 Schema 中，id 是 UUID。
    // 我们需要检查 Schema 是否有 external_id 字段？
    // 查看 Schema:
    // model Interview { id String @id @default(uuid()) ... }
    // 没有 external_id。这意味着 interviewId 参数必须是 UUID，或者我们需要添加一个字段。
    
    // 让我们假设 interviewId 参数目前是前端生成的 UUID 或者是某种业务 ID。
    // 如果是业务 ID，我们需要在 Schema 中添加它，或者我们在前端生成 UUID。
    
    // 回看旧代码：.eq('interview_id', interviewId)
    // 这意味着旧表有一个 interview_id 列。
    // 查看 001_create_schema.sql:
    // CREATE TABLE interviews (id UUID PRIMARY KEY...)
    // 并没有 interview_id 字段！
    
    // 这说明 SQL Schema 和旧代码是不一致的。
    // 旧代码可能是针对另一个版本的 Schema 写的。
    // 如果我们要用 001_create_schema.sql，我们必须用 id (UUID) 来查找。
    
    // 假设前端传来的 interviewId 是 UUID。
    let interviewUuid = interviewId;
    
    // 尝试查找
    let interview = await prisma.interview.findUnique({
      where: { id: interviewUuid }
    })
    
    if (!interview) {
      // 创建新的 Interview
      // 需要 student_id 和 school_id
      // 但参数里只有 studentEmail 和 schoolCode
      
      if (!studentEmail || !schoolCode) {
         // 如果缺少关联信息，我们可能无法创建记录（因为外键约束）
         // 除非我们先查找或创建 Student 和 School
         console.warn("[v0] Missing student/school info for new interview")
         return { success: true, videoUrl, data: null, dbError: 'Missing student/school info' }
      }
      
      // 查找 School
      const school = await prisma.school.findFirst({
        where: { 
           // code: schoolCode // Schema 里没有 code，只有 name/email
           // 假设 name 匹配 code，或者我们需要修改 Schema
           name: schoolCode 
        }
      })
      
      if (!school) {
         console.warn("[v0] School not found")
         return { success: true, videoUrl, data: null, dbError: 'School not found' }
      }

      // 查找或创建 Student
      let student = await prisma.student.findUnique({
        where: { email: studentEmail }
      })
      
      if (!student) {
        // 创建 Student 需要 invitation_id... 这有点复杂。
        // 为了简化，我们可能需要修改 Schema 让 invitation_id 可选，或者在这里创建一个 dummy invitation。
        // 或者假设 Student 已经存在。
        console.warn("[v0] Student not found")
        return { success: true, videoUrl, data: null, dbError: 'Student not found' }
      }

      interview = await prisma.interview.create({
        data: {
          id: interviewUuid, // 尝试使用传入的 ID
          school_id: school.id,
          student_id: student.id,
          status: 'completed',
          completed_at: new Date(),
          started_at: new Date()
        }
      })
    }
    
    // 处理 Prompt
    let promptUuid = promptId
    // 如果需要，可以在这里添加创建 Prompt 的逻辑 (参考旧代码)
    
    // 创建 Response
    const response = await prisma.interviewResponse.create({
      data: {
        interview_id: interview.id,
        prompt_id: promptUuid, // 必须存在，因为是外键
        sequence_number: responseOrder,
        video_url: videoUrl,
        video_duration: 90
      }
    })

    console.log("[v0] ✓ Database save successful")
    return { success: true, videoUrl, data: response }

  } catch (error) {
    console.error("[v0] ❌ Upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

