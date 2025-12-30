/**
 * 将 Supabase 导出的数据导入到本地 PostgreSQL
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importData(filename) {
  console.log('🚀 开始导入数据到 PostgreSQL...\n')
  
  // 读取导出文件
  if (!fs.existsSync(filename)) {
    console.error(`❌ 文件不存在: ${filename}`)
    process.exit(1)
  }
  
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'))
  
  let stats = {
    schools: 0,
    students: 0,
    interviews: 0,
    responses: 0,
    prompts: 0,
    invitations: 0,
    skipped: {
      schools: 0,
      students: 0,
      interviews: 0
    }
  }

  try {
    // 1. 导入学校数据（跳过 super admin 和 system）
    console.log('🏫 导入学校数据...')
    for (const school of data.schools) {
      // 跳过系统学校
      if (school.code === '_system' || !school.code) {
        console.log(`   ⊘ 跳过系统学校: ${school.name}`)
        stats.skipped.schools++
        continue
      }
      
      // 跳过已存在的学校（按 code 检查）
      const existing = await prisma.school.findUnique({
        where: { code: school.code }
      })
      
      if (existing) {
        console.log(`   ⊘ 跳过已存在学校: ${school.name} (${school.code})`)
        stats.skipped.schools++
        continue
      }

      // 为没有 email 和 password 的学校生成默认值
      const email = school.email || `admin@${school.code}.edu`
      // ⚠️ 注意：如果学校已存在，代码会在上面跳过，不会执行到这里
      // 所以这里只处理新学校的情况
      const defaultPassword = await bcrypt.hash('asdf123!', 10)
      const passwordHash = school.password_hash || defaultPassword

      await prisma.school.create({
        data: {
          id: school.id,
          code: school.code,
          name: school.name,
          email: email,
          password_hash: passwordHash,
          contact_person: school.contact_person || school.settings?.contact_email || null,
          phone: school.phone || null,
          active: school.active ?? true,
          is_super_admin: false, // 导入的学校都设为普通管理员
          credits_balance: school.credits_balance || 0,
          created_at: school.created_at ? new Date(school.created_at) : new Date(),
          updated_at: school.updated_at ? new Date(school.updated_at) : new Date()
        }
      })
      console.log(`   ✓ 导入学校: ${school.name} (${email})`)
      stats.schools++
    }

    // 2. 导入邀请数据
    console.log('\n✉️  导入邀请数据...')
    for (const invitation of data.invitations) {
      // 检查关联的学校是否存在
      const school = await prisma.school.findUnique({
        where: { id: invitation.school_id }
      })
      
      if (!school) {
        console.log(`   ⊘ 跳过（学校不存在）: ${invitation.student_email}`)
        continue
      }

      await prisma.invitation.create({
        data: {
          id: invitation.id,
          school_id: invitation.school_id,
          student_email: invitation.student_email,
          student_name: invitation.student_name,
          invitation_token: invitation.invitation_token,
          status: invitation.status || 'pending',
          expires_at: invitation.expires_at ? new Date(invitation.expires_at) : null,
          sent_at: invitation.sent_at ? new Date(invitation.sent_at) : null,
          created_at: invitation.created_at ? new Date(invitation.created_at) : new Date()
        }
      })
      console.log(`   ✓ 导入邀请: ${invitation.student_email}`)
      stats.invitations++
    }

    // 3. 导入学生数据
    console.log('\n👨‍🎓 导入学生数据...')
    for (const student of data.students) {
      // 检查是否已存在
      const existing = await prisma.student.findUnique({
        where: { email: student.email }
      })
      
      if (existing) {
        console.log(`   ⊘ 跳过已存在学生: ${student.email}`)
        stats.skipped.students++
        continue
      }

      await prisma.student.create({
        data: {
          id: student.id,
          invitation_id: student.invitation_id,
          email: student.email,
          name: student.name,
          password_hash: student.password_hash,
          phone: student.phone,
          date_of_birth: student.date_of_birth ? new Date(student.date_of_birth) : null,
          nationality: student.nationality,
          id_verification_status: student.id_verification_status || 'pending',
          id_document_url: student.id_document_url,
          selfie_url: student.selfie_url,
          created_at: student.created_at ? new Date(student.created_at) : new Date(),
          updated_at: student.updated_at ? new Date(student.updated_at) : new Date()
        }
      })
      console.log(`   ✓ 导入学生: ${student.name} (${student.email})`)
      stats.students++
    }

    // 4. 导入题目数据
    console.log('\n❓ 导入题目数据...')
    for (const prompt of data.prompts) {
      // 检查题目是否已存在
      const existingPrompt = await prisma.prompt.findUnique({
        where: { id: prompt.id }
      })
      
      if (existingPrompt) {
        console.log(`   ⊘ 跳过已存在题目: ${prompt.prompt_text?.substring(0, 40)}...`)
        continue
      }
      
      // 检查关联的学校是否存在
      if (prompt.school_id) {
        const school = await prisma.school.findUnique({
          where: { id: prompt.school_id }
        })
        
        if (!school) {
          console.log(`   ⊘ 跳过（学校不存在）: ${prompt.prompt_text?.substring(0, 50)}...`)
          continue
        }
      }

      await prisma.prompt.create({
        data: {
          id: prompt.id,
          category: prompt.category,
          prompt_text: prompt.prompt_text,
          preparation_time: prompt.preparation_time || 30,
          response_time: prompt.response_time || 60,
          difficulty_level: prompt.difficulty_level,
          is_active: prompt.is_active ?? true,
          school_id: prompt.school_id,
          created_at: prompt.created_at ? new Date(prompt.created_at) : new Date()
        }
      })
      console.log(`   ✓ 导入题目: ${prompt.category} - ${prompt.prompt_text?.substring(0, 40)}...`)
      stats.prompts++
    }

    // 5. 导入面试数据
    console.log('\n🎤 导入面试数据...')
    for (const interview of data.interviews) {
      // 根据 school_code 查找学校
      let school = null
      if (interview.school_id) {
        school = await prisma.school.findUnique({
          where: { id: interview.school_id }
        })
      } else if (interview.school_code) {
        school = await prisma.school.findUnique({
          where: { code: interview.school_code }
        })
      }
      
      if (!school) {
        console.log(`   ⊘ 跳过（学校不存在）: ${interview.school_code || interview.school_id}`)
        stats.skipped.interviews++
        continue
      }

      // 查找或创建学生
      let student = null
      if (interview.student_id) {
        student = await prisma.student.findUnique({
          where: { id: interview.student_id }
        })
      } else if (interview.student_email || interview.metadata?.student_email) {
        const studentEmail = interview.student_email || interview.metadata?.student_email
        student = await prisma.student.findUnique({
          where: { email: studentEmail }
        })
        
        // 如果学生不存在，创建一个
        if (!student && studentEmail) {
          const studentName = interview.student_name || interview.metadata?.student_name || studentEmail.split('@')[0]
          const tempPassword = await bcrypt.hash('temp_' + Date.now(), 10)
          
          student = await prisma.student.create({
            data: {
              email: studentEmail,
              name: studentName,
              password_hash: tempPassword,
              invitation_id: null
            }
          })
          console.log(`   → 自动创建学生: ${studentName} (${studentEmail})`)
          stats.students++
        }
      }
      
      if (!student) {
        console.log(`   ⊘ 跳过（学生信息缺失）: ${interview.id}`)
        stats.skipped.interviews++
        continue
      }

      await prisma.interview.create({
        data: {
          id: interview.id,
          interview_id: interview.interview_id,
          student_id: student.id, // 使用查找到的学生 ID
          school_id: school.id, // 使用查找到的学校 ID
          school_code: school.code, // 从学校记录获取 code
          status: interview.status || 'not_started',
          video_url: interview.video_url,
          subtitle_url: interview.subtitle_url,
          total_duration: interview.total_duration,
          metadata: interview.metadata,
          started_at: interview.started_at ? new Date(interview.started_at) : null,
          completed_at: interview.completed_at ? new Date(interview.completed_at) : null,
          submitted_at: interview.submitted_at ? new Date(interview.submitted_at) : null,
          transcription_status: interview.transcription_status || 'pending',
          transcription_text: interview.transcription_text,
          transcription_metadata: interview.transcription_metadata,
          transcription_job_id: interview.transcription_job_id,
          ai_summary: interview.ai_summary,
          total_score: interview.total_score,
          fluency_score: interview.fluency_score,
          coherence_score: interview.coherence_score,
          vocabulary_score: interview.vocabulary_score,
          grammar_score: interview.grammar_score,
          pronunciation_score: interview.pronunciation_score,
          verification_status: interview.verification_status || 'pending',
          created_at: interview.created_at ? new Date(interview.created_at) : new Date(),
          updated_at: interview.updated_at ? new Date(interview.updated_at) : new Date()
        }
      })
      console.log(`   ✓ 导入面试: ${interview.id}`)
      stats.interviews++
    }

    // 6. 导出面试回答数据
    console.log('\n💬 导入面试回答数据...')
    for (const response of data.interview_responses) {
      // 检查面试和题目是否存在
      const interview = await prisma.interview.findUnique({
        where: { id: response.interview_id }
      })
      const prompt = await prisma.prompt.findUnique({
        where: { id: response.prompt_id }
      })
      
      if (!interview || !prompt) {
        console.log(`   ⊘ 跳过（面试或题目不存在）: ${response.id}`)
        continue
      }

      await prisma.interviewResponse.create({
        data: {
          id: response.id,
          interview_id: response.interview_id,
          prompt_id: response.prompt_id,
          sequence_number: response.sequence_number,
          video_url: response.video_url,
          video_duration: response.video_duration,
          transcription: response.transcription,
          score: response.score,
          feedback: response.feedback,
          created_at: response.created_at ? new Date(response.created_at) : new Date()
        }
      })
      console.log(`   ✓ 导入回答: ${response.id}`)
      stats.responses++
    }

    // 保存统计信息
    console.log('\n' + '='.repeat(50))
    console.log('✅ 导入完成！')
    console.log('='.repeat(50))
    console.log('\n📊 导入统计:')
    console.log(`   学校:     ${stats.schools} 个 (跳过 ${stats.skipped.schools} 个)`)
    console.log(`   学生:     ${stats.students} 个 (跳过 ${stats.skipped.students} 个)`)
    console.log(`   邀请:     ${stats.invitations} 个`)
    console.log(`   题目:     ${stats.prompts} 个`)
    console.log(`   面试:     ${stats.interviews} 个 (跳过 ${stats.skipped.interviews} 个)`)
    console.log(`   回答:     ${stats.responses} 个`)
    
  } catch (error) {
    console.error('\n❌ 导入失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行
const filename = process.argv[2] || `supabase-export-${new Date().toISOString().split('T')[0]}.json`
importData(filename)

