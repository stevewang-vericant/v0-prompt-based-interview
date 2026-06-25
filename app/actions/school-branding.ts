"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "./auth"
import { toClientError } from "@/lib/errors"
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

// Keep these in sync with the client-side validation in the settings page.
const MAX_LOGO_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_INTRO_VIDEO_BYTES = 50 * 1024 * 1024 // 50 MB (Server Actions body limit is 50mb)

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"]

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
}

export interface SchoolBranding {
  logoUrl: string | null
  introVideoUrl: string | null
}

function assertB2Configured() {
  if (!process.env.B2_BUCKET_NAME) throw new Error("B2_BUCKET_NAME not configured")
  if (!process.env.B2_BUCKET_REGION) throw new Error("B2_BUCKET_REGION not configured")
  if (!process.env.B2_APPLICATION_KEY_ID) throw new Error("B2_APPLICATION_KEY_ID not configured")
  if (!process.env.B2_APPLICATION_KEY) throw new Error("B2_APPLICATION_KEY not configured")
}

async function uploadToB2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  assertB2Configured()
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )
  return `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${key}`
}

/**
 * Get the current (authenticated) school's branding assets.
 */
export async function getSchoolBranding(): Promise<{
  success: boolean
  branding?: SchoolBranding
  error?: string
}> {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: "Not authenticated" }
    }

    const school = await prisma.school.findUnique({
      where: { id: userResult.user.school.id },
      select: { logo_url: true, intro_video_url: true },
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    return {
      success: true,
      branding: { logoUrl: school.logo_url, introVideoUrl: school.intro_video_url },
    }
  } catch (error) {
    console.error("[Branding] Error fetching branding:", error)
    return { success: false, error: toClientError(error) }
  }
}

/**
 * Upload (or replace) the school logo and persist its URL.
 */
export async function uploadSchoolLogo(formData: FormData): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: "Not authenticated" }
    }

    const file = formData.get("file")
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No file provided" }
    }

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      return { success: false, error: "Logo must be a PNG, JPEG, WEBP, or SVG image" }
    }

    if (file.size > MAX_LOGO_BYTES) {
      return { success: false, error: "Logo must be 5 MB or smaller" }
    }

    const schoolId = userResult.user.school.id
    const ext = EXTENSION_BY_TYPE[file.type] || "png"
    const key = `schools/${schoolId}/logo-${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToB2(buffer, key, file.type)

    await prisma.school.update({
      where: { id: schoolId },
      data: { logo_url: url },
    })

    return { success: true, url }
  } catch (error) {
    console.error("[Branding] Error uploading logo:", error)
    return { success: false, error: toClientError(error, "Upload failed") }
  }
}

/**
 * Upload (or replace) the school intro video and persist its URL.
 */
export async function uploadSchoolIntroVideo(formData: FormData): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: "Not authenticated" }
    }

    const file = formData.get("file")
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No file provided" }
    }

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return { success: false, error: "Intro video must be an MP4, WEBM, MOV, or OGG video" }
    }

    if (file.size > MAX_INTRO_VIDEO_BYTES) {
      return { success: false, error: "Intro video must be 50 MB or smaller" }
    }

    const schoolId = userResult.user.school.id
    const ext = EXTENSION_BY_TYPE[file.type] || "mp4"
    const key = `schools/${schoolId}/intro-video-${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToB2(buffer, key, file.type)

    await prisma.school.update({
      where: { id: schoolId },
      data: { intro_video_url: url },
    })

    return { success: true, url }
  } catch (error) {
    console.error("[Branding] Error uploading intro video:", error)
    return { success: false, error: toClientError(error, "Upload failed") }
  }
}

/**
 * Remove the school logo or intro video (clears the stored URL).
 * The underlying B2 object is intentionally left in place.
 */
export async function removeSchoolBrandingAsset(asset: "logo" | "intro_video"): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: "Not authenticated" }
    }

    await prisma.school.update({
      where: { id: userResult.user.school.id },
      data: asset === "logo" ? { logo_url: null } : { intro_video_url: null },
    })

    return { success: true }
  } catch (error) {
    console.error("[Branding] Error removing branding asset:", error)
    return { success: false, error: toClientError(error) }
  }
}

/**
 * Public lookup of a school's branding by school code, used by the student
 * interview page. Returns nulls (not an error) when the school has no branding.
 */
export async function getSchoolBrandingByCode(schoolCode: string): Promise<{
  success: boolean
  branding?: SchoolBranding & { name: string | null }
  error?: string
}> {
  try {
    if (!schoolCode) {
      return { success: true, branding: { logoUrl: null, introVideoUrl: null, name: null } }
    }

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
      select: { name: true, logo_url: true, intro_video_url: true },
    })

    if (!school) {
      return { success: true, branding: { logoUrl: null, introVideoUrl: null, name: null } }
    }

    return {
      success: true,
      branding: { logoUrl: school.logo_url, introVideoUrl: school.intro_video_url, name: school.name },
    }
  } catch (error) {
    console.error("[Branding] Error fetching branding by code:", error)
    return { success: false, error: toClientError(error) }
  }
}
