# Supabase to Local Postgres Migration Guide

You have successfully migrated the codebase configuration from Supabase to a local PostgreSQL + Prisma setup.

## 1. Prerequisites

Ensure you have the following installed:
- Docker & Docker Compose
- Node.js & pnpm

## 2. Setup Environment Variables

Create a `.env` file in the root directory with the following content:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/v0_interview"

# Next Auth (Generate a new secret with: openssl rand -base64 32)
AUTH_SECRET="replace_me_with_secure_random_string"

# B2 Storage (Keep your existing keys)
B2_APPLICATION_KEY_ID="your_key_id"
B2_APPLICATION_KEY="your_key"
B2_BUCKET_NAME="your_bucket"
B2_BUCKET_REGION="your_region"

# OpenAI (Required for transcription)
OPENAI_API_KEY="your_openai_api_key"
```

## 3. Install Dependencies

Run the following command to install Prisma and other required packages:

```bash
pnpm install
pnpm add -D prisma
pnpm add @prisma/client bcrypt jose
pnpm add -D @types/bcrypt
```

## 4. Start Database

Start the local PostgreSQL database using Docker:

```bash
docker-compose up -d postgres
```

## 5. Initialize Database Schema

Push the Prisma schema to your local database:

```bash
npx prisma db push
```

## 6. Seed Data (Optional)

You can manually insert initial data (like schools and prompts) using Prisma Studio:

```bash
npx prisma studio
```

## 7. Run the Application

```bash
pnpm dev
```

## Notes on Changes

- **Authentication**: Switched from Supabase Auth to a custom JWT implementation (`lib/auth-utils.ts`, `jose`).
- **Database**: Switched from Supabase Client (`supabase-js`) to Prisma ORM (`lib/prisma.ts`).
- **File Upload**: Updated `app/actions/upload-video.ts` to use Prisma for saving metadata.
- **Schema**: Modified `prisma/schema.prisma` to be more flexible (added `code` to School, made `invitation_id` optional).
- **Transcription**: Migrated transcription logic (`app/actions/transcription.ts` etc.) to use Prisma.
- **API Routes**: All API routes in `app/api/*` have been migrated to use Prisma.

## Troubleshooting

- If you encounter `P1001` errors, ensure Docker is running and port 5432 is available.
- If `pnpm install` fails due to certificates, try using a different network or configuring npm strictly ssl false (not recommended for prod).
