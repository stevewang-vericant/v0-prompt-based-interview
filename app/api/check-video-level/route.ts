import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const video = formData.get('video') as File

  if (!video) {
    return NextResponse.json({ error: 'No video file' }, { status: 400 })
  }

  const tempDir = tmpdir()
  const tempFile = join(tempDir, `check-level-${Date.now()}.mp4`)
  const outputFile = join(tempDir, `output-${Date.now()}.txt`)

  try {
    // 保存上传的文件
    const buffer = Buffer.from(await video.arrayBuffer())
    await writeFile(tempFile, buffer)

    // 使用 ffprobe 检查 level
    const command = `ffprobe -v error -select_streams v:0 -show_entries stream=profile,level,codec_name,width,height,r_frame_rate,pix_fmt -of json "${tempFile}"`

    const { stdout, stderr } = await execAsync(command)
    
    if (stderr) {
      console.log('FFprobe stderr:', stderr)
    }

    const info = JSON.parse(stdout)
    const videoStream = info.streams?.[0]

    // 清理临时文件
    await unlink(tempFile).catch(() => {})

    return NextResponse.json({
      level: videoStream?.level,
      profile: videoStream?.profile,
      codec: videoStream?.codec_name,
      width: videoStream?.width,
      height: videoStream?.height,
      frameRate: videoStream?.r_frame_rate,
      pixFmt: videoStream?.pix_fmt,
    })
  } catch (error) {
    // 清理临时文件
    await unlink(tempFile).catch(() => {})
    await unlink(outputFile).catch(() => {})

    console.error('Error checking video level:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

