# 使用官方 Node.js 镜像
FROM node:20-alpine AS base

# 安装依赖阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建参数（从 docker-compose 传递）
ARG NEXT_PUBLIC_APP_URL

# 设置环境变量（Next.js 的 NEXT_PUBLIC_* 需要在构建时可用）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# 生成 Prisma Client（必须在构建之前）
# 使用项目中安装的 prisma 版本，而不是 npx
RUN pnpm exec prisma generate

# 构建应用
RUN pnpm build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

# 安装 FFmpeg 和 ffprobe（视频处理）
RUN apk add --no-cache ffmpeg

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 复制 Prisma schema 和包
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
# standalone 模式下 node_modules 已经在 .next/standalone 中

# 修复 pnpm 的 Prisma Client 路径问题
# 在 standalone 模式下，需要创建符号链接
RUN if [ -d /app/node_modules/.pnpm ]; then \
      PRISMA_PATH=$(find /app/node_modules/.pnpm -name ".prisma" -type d 2>/dev/null | head -1); \
      if [ -n "$PRISMA_PATH" ]; then \
        ln -sf "$PRISMA_PATH" /app/node_modules/.prisma; \
      fi; \
    fi

# 设置权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 启动应用
CMD ["node", "server.js"]


