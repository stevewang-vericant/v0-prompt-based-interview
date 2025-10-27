/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 支持 Docker 部署
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
        // 播放页面不需要严格的 COEP，允许加载外部视频
        source: '/school/watch',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        // 学生观看页面也不需要严格的 COEP
        source: '/student/watch',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        // 其他页面（特别是面试页面）需要 SharedArrayBuffer 支持
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
