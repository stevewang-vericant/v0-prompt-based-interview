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
    console.log("[v0] Looking for interview with interview_id:", interviewId)
    
    // 使用 interview_id 字段（自定义 ID）而不是 id（UUID）
    let interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId }
    })
    
    if (!interview) {
      console.log("[v0] Interview not found, creating new one...")
      
      if (!studentEmail || !schoolCode) {
         console.warn("[v0] Missing student/school info for new interview")
         return { success: true, videoUrl, data: null, dbError: 'Missing student/school info' }
      }
      
      // 查找 School（使用 code 字段）
      const school = await prisma.school.findFirst({
        where: { code: schoolCode }
      })
      
      if (!school) {
         console.warn("[v0] School not found with code:", schoolCode)
         return { success: true, videoUrl, data: null, dbError: 'School not found' }
      }

      // 查找或创建 Student
      let student = await prisma.student.findUnique({
        where: { email: studentEmail }
      })
      
      if (!student) {
        console.log("[v0] Student not found, creating new student...")
        // 创建一个新的 Student（invitation_id 可以为 null）
        // 生成一个临时密码 hash（学生可以稍后重置）
        const tempPasswordHash = await import('bcrypt').then(bcrypt => 
          bcrypt.hash('temp_' + Date.now(), 10)
        )
        
        student = await prisma.student.create({
          data: {
            email: studentEmail,
            name: studentName || studentEmail.split('@')[0],
            password_hash: tempPasswordHash,
            invitation_id: null // 允许为 null
          }
        })
        console.log("[v0] Created new student:", student.id)
      }

      // 创建新的 Interview
      interview = await prisma.interview.create({
        data: {
          interview_id: interviewId, // 使用自定义 ID
          school_id: school.id,
          school_code: schoolCode, // 也保存 school_code 方便查询
          student_id: student.id,
          status: 'in_progress',
          started_at: new Date()
        }
      })
      console.log("[v0] Created new interview:", interview.id)
    }
    
    // 处理 Prompt - 查找或创建
    console.log("[v0] Looking for prompt with text:", promptText?.substring(0, 50))
    let prompt = null
    
    // 首先尝试通过文本查找（因为前端传的 promptId 是 "1", "2" 等，不是 UUID）
    if (promptText) {
      prompt = await prisma.prompt.findFirst({
        where: { 
          school_id: interview.school_id,
          prompt_text: promptText // 使用正确的字段名
        }
      })
    }
    
    // 如果没找到，创建新的 prompt
    if (!prompt && promptText) {
      console.log("[v0] Prompt not found, creating new one...")
      prompt = await prisma.prompt.create({
        data: {
          school_id: interview.school_id,
          prompt_text: promptText, // 使用正确的字段名
          category: promptCategory || 'General',
          preparation_time: 20,
          response_time: promptResponseTime || 90,
          is_active: true // 使用正确的字段名
        }
      })
      console.log("[v0] Created new prompt:", prompt.id)
    }
    
    if (!prompt) {
      console.warn("[v0] Could not find or create prompt - missing promptText")
      return { success: true, videoUrl, data: null, dbError: 'Prompt not found' }
    }
    
    // 创建 Response
    const response = await prisma.interviewResponse.create({
      data: {
        interview_id: interview.id,
        prompt_id: prompt.id,
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

