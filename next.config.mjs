/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 支持 Docker 部署
  eslint: {
    // ESLint is still skipped at build time; the codebase has pre-existing lint
    // debt that would otherwise block deploys. Run `npm run lint` separately.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors now fail the build. Keep this on to prevent shipping type regressions.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // 确保 Prisma 相关文件被包含在 standalone 输出中
  outputFileTracingIncludes: {
    '/*': ['./node_modules/.prisma/**/*', './node_modules/@prisma/**/*'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // 增加 Server Actions 的 body size 限制，支持视频上传
    },
  },
  // 为 FFmpeg.wasm 启用 SharedArrayBuffer 支持
  async headers() {
    return [
      {
        // 所有页面需要 SharedArrayBuffer 支持（用于面试录制）
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
