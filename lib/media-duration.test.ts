import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ffprobeDurationCommand,
  isMissingContainerDurationError,
  parseFormatDuration,
  probeMediaDurationSeconds,
  remuxDurationCommand,
} from './media-duration.ts'

test('parseFormatDuration accepts positive numbers only', () => {
  assert.equal(parseFormatDuration('110.666000\n'), 110.666)
  assert.equal(parseFormatDuration('N/A'), null)
  assert.equal(parseFormatDuration(''), null)
  assert.equal(parseFormatDuration('0'), null)
  assert.equal(parseFormatDuration('-3'), null)
})

test('probe uses the container duration when ffprobe has one', async () => {
  const commands: string[] = []
  const result = await probeMediaDurationSeconds('/tmp/segment.webm', async (command) => {
    commands.push(command)
    return { stdout: '80.5\n' }
  })
  assert.deepEqual(result, { seconds: 80.5, recovered: false, mediaPath: '/tmp/segment.webm' })
  assert.equal(commands.length, 1)
  assert.match(commands[0], /^ffprobe /)
})

test('probe remuxes when the container duration is missing', async () => {
  const commands: string[] = []
  const result = await probeMediaDurationSeconds('/tmp/segment 1.webm', async (command) => {
    commands.push(command)
    if (command.startsWith('ffprobe') && commands.filter((item) => item.startsWith('ffprobe')).length === 1) {
      return { stdout: 'N/A\n' }
    }
    if (command.startsWith('ffmpeg')) {
      assert.match(command, /-c copy/)
      assert.match(command, /-fflags \+genpts/)
      assert.match(command, /'\/tmp\/segment 1\.webm'/)
      return { stdout: '' }
    }
    return { stdout: '110.666000\n' }
  })
  assert.deepEqual(result, {
    seconds: 110.666,
    recovered: true,
    mediaPath: '/tmp/segment 1.webm.duration-fixed.webm',
  })
  assert.equal(commands.length, 3)
  assert.equal(
    remuxDurationCommand('/tmp/segment 1.webm', '/tmp/segment 1.webm.duration-fixed.webm'),
    commands[1],
  )
})

test('probe throws the retryable error when remux still has no duration', async () => {
  await assert.rejects(
    () =>
      probeMediaDurationSeconds('/tmp/broken.webm', async (command) => {
        return { stdout: command.startsWith('ffmpeg') ? '' : 'N/A\n' }
      }),
    (error: unknown) => {
      assert.ok(error instanceof Error)
      assert.equal(isMissingContainerDurationError(error.message), true)
      return true
    },
  )
})

test('duration command quotes paths', () => {
  assert.equal(
    ffprobeDurationCommand("/tmp/it's.webm"),
    `ffprobe -v error -show_entries format=duration -of csv=p=0 '/tmp/it'\\''s.webm'`,
  )
})
