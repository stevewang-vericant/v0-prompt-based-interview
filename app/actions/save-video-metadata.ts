"use server"

import { prisma } from "@/lib/prisma"
import { startTranscription } from "./transcription"

export async function saveVideoMetadata(
  videoUrl: string,
  interviewId: string,
  promptId: string,
  responseOrder: number,
  schoolCode?: string | null,
  studentEmail?: string,
  studentName?: string
): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    console.log("[v0] ===== Saving video metadata (Prisma) =====")
    
    // 1. Find or Create Interview
    // Using upsert logic similar to upload-video.ts
    
    // Need external IDs to be resolved to internal UUIDs for Prisma relations
    // This part is tricky because we need to know if we can create new students/schools on the fly.
    // upload-video.ts logic was: find interview by custom ID, if not found, create it (needing school/student).
    
    // First, try to find the interview
    let interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId }
    })

    if (!interview) {
        // We need to create it.
        // Check required fields
        if (!schoolCode || !studentEmail) {
            return { success: false, error: "Missing schoolCode or studentEmail for new interview" }
        }

        // Resolve School
        const school = await prisma.school.findFirst({ where: { code: schoolCode } })
        if (!school) return { success: false, error: "School not found" }

        // Resolve Student
        const student = await prisma.student.findUnique({ where: { email: studentEmail } })
        if (!student) return { success: false, error: "Student not found" }

        interview = await prisma.interview.create({
            data: {
                interview_id: interviewId,
                school_id: school.id,
                student_id: student.id,
                video_url: videoUrl, // Setting initial video URL
                status: 'completed', // Assuming this function is called after upload
                completed_at: new Date(),
                started_at: new Date()
            }
        })
    }

    // 2. Create Response
    // Resolve Prompt UUID
    // Assuming promptId passed here IS the UUID. If it's external ID, we need to look it up.
    // But prompts usually don't have external IDs in this system, usually UUIDs from frontend.
    // Let's assume it's UUID.
    
    const response = await prisma.interviewResponse.create({
        data: {
            interview_id: interview.id,
            prompt_id: promptId,
            video_url: videoUrl,
            sequence_number: responseOrder,
            video_duration: 90,
        }
    })

    console.log("[v0] ✓ Database save successful")

    // If complete video, start transcription
    if (responseOrder === 0) {
      startTranscription(interviewId, videoUrl).catch(err => {
          console.error("Transcription start failed:", err)
      })
    }

    return { success: true, data: response }

  } catch (error) {
    console.error("[v0] ❌ Metadata save error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Save failed",
    }
  }
}
