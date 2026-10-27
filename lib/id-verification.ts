import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requiresIdVerification } from "@/lib/school-level"

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export type VerificationImageKind = "id_photo" | "screenshot"
export type VerificationDecision = "approved" | "rejected"

const s3Client = new S3Client({
  endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
  region: process.env.B2_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true,
})

export function isInterviewPublicId(value: string): boolean {
  return /^interview-[a-zA-Z0-9_-]{6,120}$/.test(value)
}

function assertB2Configured() {
  if (!process.env.B2_BUCKET_NAME) throw new Error("B2_BUCKET_NAME not configured")
  if (!process.env.B2_BUCKET_REGION) throw new Error("B2_BUCKET_REGION not configured")
  if (!process.env.B2_APPLICATION_KEY_ID) throw new Error("B2_APPLICATION_KEY_ID not configured")
  if (!process.env.B2_APPLICATION_KEY) throw new Error("B2_APPLICATION_KEY not configured")
}

function objectKind(kind: VerificationImageKind): "id-photo" | "screenshot" {
  return kind === "id_photo" ? "id-photo" : "screenshot"
}

export function acceptedVerificationUrl(
  url: string | null | undefined,
  interviewPublicId: string,
  kind: "id-photo" | "screenshot",
): string | null {
  if (!url || !process.env.B2_BUCKET_NAME || !isInterviewPublicId(interviewPublicId)) return null
  const trimmed = url.trim()
  const prefix = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/interviews/${interviewPublicId}/id-verification/${kind}.`
  if (!trimmed.startsWith(prefix)) return null
  const ext = trimmed.slice(prefix.length)
  if (!["jpg", "png", "webp"].includes(ext)) return null
  return trimmed
}

function matchesImageType(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg" || mime === "image/jpg") {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (mime === "image/png") {
    return (
      bytes.length > 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    )
  }
  if (mime === "image/webp") {
    return (
      bytes.length > 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    )
  }
  return false
}

export async function uploadVerificationImage(params: {
  interviewPublicId: string
  schoolCode: string
  kind: VerificationImageKind
  file: Blob
}): Promise<{ url: string }> {
  const interviewPublicId = params.interviewPublicId.trim()
  const schoolCode = params.schoolCode.trim()
  if (!isInterviewPublicId(interviewPublicId)) {
    throw new Error("Interview ID is invalid.")
  }
  if (!schoolCode) {
    throw new Error("School code is required.")
  }

  const mime = params.file.type
  if (!ALLOWED_TYPES.includes(mime as (typeof ALLOWED_TYPES)[number])) {
    throw new Error("Photo must be a JPEG, PNG, or WEBP image.")
  }
  if (params.file.size <= 0 || params.file.size > MAX_IMAGE_BYTES) {
    throw new Error("Photo must be 8 MB or smaller.")
  }

  const school = await prisma.school.findFirst({
    where: { code: schoolCode, active: true },
    select: { id: true, level: true },
  })
  if (!school) {
    throw new Error("School not found.")
  }
  if (!requiresIdVerification(school.level)) {
    throw new Error("ID verification is only used for higher education interviews.")
  }

  const existing = await prisma.interview.findUnique({
    where: { interview_id: interviewPublicId },
    select: { id: true, school_id: true, student_id: true, interview_type: true },
  })
  if (existing) {
    if (existing.school_id !== school.id) {
      throw new Error("This interview belongs to a different school.")
    }
    if (existing.interview_type === "parent") {
      throw new Error("ID verification applies to student interviews.")
    }
  }

  const bytes = new Uint8Array(await params.file.arrayBuffer())
  if (!matchesImageType(bytes, mime)) {
    throw new Error("Photo file does not match its image type.")
  }

  const ext = EXTENSION_BY_TYPE[mime] || "jpg"
  const contentType = mime === "image/jpg" ? "image/jpeg" : mime
  const key = `interviews/${interviewPublicId}/id-verification/${objectKind(params.kind)}.${ext}`

  assertB2Configured()
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: contentType,
    }),
  )

  const url = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${key}`

  if (existing) {
    await attachIdVerificationAssets({
      interviewDbId: existing.id,
      studentId: existing.student_id,
      interviewPublicId,
      idPhotoUrl: params.kind === "id_photo" ? url : null,
      screenshotUrl: params.kind === "screenshot" ? url : null,
    })
  }

  return { url }
}

export async function attachIdVerificationAssets(params: {
  interviewDbId: string
  studentId: string | null
  interviewPublicId: string
  idPhotoUrl?: string | null
  screenshotUrl?: string | null
}): Promise<void> {
  const idPhotoUrl = acceptedVerificationUrl(params.idPhotoUrl, params.interviewPublicId, "id-photo")
  const screenshotUrl = acceptedVerificationUrl(
    params.screenshotUrl,
    params.interviewPublicId,
    "screenshot",
  )
  if (!idPhotoUrl && !screenshotUrl) return

  const interview = await prisma.interview.findUnique({
    where: { id: params.interviewDbId },
    select: {
      id: true,
      student_id: true,
      id_photo_url: true,
      verification_screenshot_url: true,
      verification_status: true,
      school: { select: { level: true } },
    },
  })
  if (!interview || !requiresIdVerification(interview.school.level)) return

  const photoChanged = !!idPhotoUrl && idPhotoUrl !== interview.id_photo_url
  const shotChanged = !!screenshotUrl && screenshotUrl !== interview.verification_screenshot_url
  const data: Prisma.InterviewUpdateInput = {}
  if (photoChanged && idPhotoUrl) data.id_photo_url = idPhotoUrl
  if (shotChanged && screenshotUrl) data.verification_screenshot_url = screenshotUrl

  const imagesChanged = photoChanged || shotChanged
  if (imagesChanged && interview.verification_status && interview.verification_status !== "pending") {
    data.verification_status = "pending"
    data.verification_reviewed_at = null
    data.verification_reviewed_by = null
    data.verification_note = null
  }

  if (Object.keys(data).length > 0) {
    await prisma.interview.update({
      where: { id: interview.id },
      data,
    })
  }

  const studentId = params.studentId || interview.student_id
  if (!studentId) return

  const latest = await prisma.interview.findUnique({
    where: { id: interview.id },
    select: { id_photo_url: true, verification_screenshot_url: true },
  })
  if (!latest) return

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id_verification_status: true },
  })
  if (!student) return

  const bothImages = !!latest.id_photo_url && !!latest.verification_screenshot_url
  let status = student.id_verification_status
  if (imagesChanged) {
    status = bothImages ? "submitted" : "pending"
  } else if (bothImages && (!status || status === "pending")) {
    status = "submitted"
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      id_document_url: latest.id_photo_url || undefined,
      selfie_url: latest.verification_screenshot_url || undefined,
      id_verification_status: status || undefined,
    },
  })
}
