# Supabase to Local PostgreSQL Migration Summary

## Overview
Successfully migrated from Supabase to local PostgreSQL + Prisma ORM with custom JWT authentication.

## Migration Date
December 2, 2025

## Branch
`main` (All changes committed directly after testing)

---

## 🎯 What Was Changed

### 1. Database Layer
- **From**: Supabase (hosted PostgreSQL with proprietary client)
- **To**: Local PostgreSQL + Prisma ORM
- **Database**: `v0_interview` running on `localhost:5432`

### 2. Authentication System
- **From**: Supabase Auth
- **To**: Custom JWT-based authentication using `jose` + `bcrypt`
- **Session Storage**: HttpOnly cookies with 24-hour expiration
- **Password Hashing**: bcrypt with salt rounds = 10

### 3. Data Access Layer
- **From**: `supabase-js` client (`createClient`, `createServerClient`, `createAdminClient`)
- **To**: Prisma Client with type-safe queries
- **Files Modified**: 
  - `app/actions/auth.ts` - Authentication logic
  - `app/actions/schools.ts` - School management
  - `app/actions/interviews.ts` - Interview data access
  - `app/actions/upload-video.ts` - Video upload and metadata
  - `app/actions/transcription.ts` - Transcription job management
  - `app/actions/transcription-simple.ts` - Simple transcription
  - `app/actions/save-video-metadata.ts` - Video metadata storage
  - All API routes in `app/api/`

---

## 📁 Key Files Created/Modified

### New Files
1. **`prisma/schema.prisma`** - Complete database schema with all models
2. **`lib/prisma.ts`** - Prisma Client singleton initialization
3. **`lib/auth-utils.ts`** - Password hashing utilities
4. **`scripts/seed-admin.js`** - Database seeding script for admin users
5. **`.env`** - Environment variables (DATABASE_URL, AUTH_SECRET, B2 credentials)

### Modified Files
1. **`package.json`** - Added `@prisma/client`, `prisma`, `bcrypt`, `jose`
2. **`docker-compose.yml`** - Configured PostgreSQL service
3. **`app/actions/*.ts`** - All action files migrated to Prisma
4. **`app/api/**/*.ts`** - All API routes migrated to Prisma
5. **`app/school/dashboard/page.tsx`** - Fixed to use `school.code` field
6. **`app/student/interview/page.tsx`** - Fixed hydration issues with `interviewId`
7. **`lib/indexeddb.ts`** - Fixed IndexedDB query issues

### Deprecated Files (Not Deleted, But No Longer Used)
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`

---

## 🗄️ Database Schema

### Key Models
1. **School** - School accounts with admin credentials
   - Added `code` field for interview links
   - Added `is_super_admin` field for admin management
   
2. **Student** - Student accounts
   - Made `invitation_id` optional
   
3. **Interview** - Interview sessions
   - Added `interview_id` field for custom IDs (e.g., `interview-1764662377424-k97p3ume0`)
   - Added `school_code` field for easier querying
   
4. **Prompt** - Interview questions
5. **InterviewResponse** - Student video responses
6. **TranscriptionJob** - Transcription task tracking
7. **VideoProcessingTask** - Video merging task tracking
8. **Invitation** - Student invitation system
9. **CreditTransaction** - Credit system

### Indexes
- All foreign keys have indexes
- `school.code` is unique and indexed
- `interview.interview_id` is unique and indexed
- `interview.school_code` is indexed

---

## 🔧 Bug Fixes During Migration

### 1. School Code Field Missing
**Problem**: URL showed `school=undefined` after login  
**Fix**: Added `code` field to `School` model and updated `getCurrentUser()` to return it

### 2. IndexedDB Key Error
**Problem**: `IDBKeyRange.only(false)` is not a valid key  
**Fix**: Changed to `store.getAll()` with JavaScript filtering

### 3. React Hydration Error
**Problem**: `interviewId` generated in `useState` caused SSR/CSR mismatch  
**Fix**: Moved initialization to `useEffect` to run only on client

### 4. Prisma Schema Field Mismatch
**Problem**: Code used `text`/`active` but schema had `prompt_text`/`is_active`  
**Fix**: Updated `upload-video.ts` to use correct field names

### 5. Interview ID Type Mismatch
**Problem**: Frontend uses custom IDs (`interview-timestamp-random`) but backend expected UUIDs  
**Fix**: Added `interview_id` field to store custom IDs, use it for lookups

---

## 🚀 How to Run

### Prerequisites
- PostgreSQL installed (via Postgres.app or Homebrew)
- Node.js and pnpm installed
- `.env` file configured

### Local Development
```bash
# 1. Start PostgreSQL (if using Homebrew)
brew services start postgresql@14

# 2. Push schema to database
pnpm exec prisma db push

# 3. Generate Prisma Client
pnpm exec prisma generate

# 4. Seed admin user (optional)
node scripts/seed-admin.js

# 5. Start development server
pnpm dev
```

### Deployment (Linode with Docker)
```bash
# 1. Build and start services
docker-compose up -d

# 2. Run migrations inside container
docker-compose exec app pnpm exec prisma db push

# 3. Check logs
docker-compose logs -f app
```

---

## 📝 Environment Variables

Required in `.env`:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/v0_interview"

# Authentication
AUTH_SECRET="your-secret-key-here"

# Backblaze B2 (unchanged)
B2_APPLICATION_KEY_ID="your-key-id"
B2_APPLICATION_KEY="your-key"
B2_BUCKET_NAME="your-bucket"
B2_BUCKET_REGION="us-west-004"

# OpenAI (unchanged)
OPENAI_API_KEY="your-openai-key"
```

---

## ✅ Testing Checklist

- [x] School admin registration
- [x] School admin login
- [x] School dashboard displays correct interview link
- [x] Student interview page loads without errors
- [x] Video recording works
- [x] Video upload to B2 works
- [x] Interview data saved to PostgreSQL
- [x] Student and prompt auto-creation works
- [x] IndexedDB persistence works
- [ ] Video transcription (requires testing with actual video)
- [ ] AI summary generation (requires testing with transcription)
- [ ] Credit system (requires testing)

---

## 🎓 Key Learnings

1. **Prisma Schema Design**: Always define all fields in schema before writing code
2. **Field Naming**: Stay consistent - use snake_case in database, match in code
3. **Custom IDs**: Use separate field for business IDs vs. database UUIDs
4. **Client Regeneration**: Always regenerate Prisma Client and restart server after schema changes
5. **Hydration Issues**: Be careful with `localStorage` and other browser APIs in Next.js SSR

---

## 🔮 Future Improvements

1. Add database migrations instead of `prisma db push`
2. Implement proper password reset flow
3. Add email verification for students
4. Set up automated backups
5. Add database connection pooling for production
6. Consider using Prisma Migrate for schema versioning
7. Add comprehensive error logging
8. Implement rate limiting for API routes

---

## 📞 Support

If you encounter issues:
1. Check PostgreSQL is running: `pg_isready`
2. Verify `.env` file has correct DATABASE_URL
3. Regenerate Prisma Client: `pnpm exec prisma generate`
4. Check database schema: `pnpm exec prisma studio`
5. Review logs in browser console and terminal

---

## 🙏 Credits

Migration completed with assistance from Claude (Anthropic)  
Date: December 2, 2025

