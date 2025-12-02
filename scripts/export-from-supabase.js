/**
 * 从 Supabase 导出数据
 * 导出学校、学生和面试数据
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  console.error('请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function exportData() {
  console.log('🚀 开始从 Supabase 导出数据...\n')
  
  const exportData = {
    schools: [],
    students: [],
    interviews: [],
    interview_responses: [],
    prompts: [],
    invitations: []
  }

  try {
    // 1. 导出学校数据
    console.log('📊 导出学校数据...')
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
    
    if (schoolsError) throw schoolsError
    exportData.schools = schools || []
    console.log(`   ✓ 导出 ${exportData.schools.length} 个学校`)

    // 2. 导出学生数据
    console.log('👨‍🎓 导出学生数据...')
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
    
    if (studentsError) throw studentsError
    exportData.students = students || []
    console.log(`   ✓ 导出 ${exportData.students.length} 个学生`)

    // 3. 导出面试数据
    console.log('🎤 导出面试数据...')
    const { data: interviews, error: interviewsError } = await supabase
      .from('interviews')
      .select('*')
    
    if (interviewsError) throw interviewsError
    exportData.interviews = interviews || []
    console.log(`   ✓ 导出 ${exportData.interviews.length} 个面试`)

    // 4. 导出面试回答数据
    console.log('💬 导出面试回答数据...')
    const { data: responses, error: responsesError } = await supabase
      .from('interview_responses')
      .select('*')
    
    if (responsesError) throw responsesError
    exportData.interview_responses = responses || []
    console.log(`   ✓ 导出 ${exportData.interview_responses.length} 个回答`)

    // 5. 导出题目数据
    console.log('❓ 导出题目数据...')
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
    
    if (promptsError) throw promptsError
    exportData.prompts = prompts || []
    console.log(`   ✓ 导出 ${exportData.prompts.length} 个题目`)

    // 6. 导出邀请数据
    console.log('✉️  导出邀请数据...')
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
    
    if (invitationsError) throw invitationsError
    exportData.invitations = invitations || []
    console.log(`   ✓ 导出 ${exportData.invitations.length} 个邀请`)

    // 保存到文件
    const filename = `supabase-export-${new Date().toISOString().split('T')[0]}.json`
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2))
    
    console.log(`\n✅ 导出完成！`)
    console.log(`📁 文件保存在: ${filename}`)
    console.log(`\n📊 导出统计:`)
    console.log(`   - 学校: ${exportData.schools.length}`)
    console.log(`   - 学生: ${exportData.students.length}`)
    console.log(`   - 面试: ${exportData.interviews.length}`)
    console.log(`   - 回答: ${exportData.interview_responses.length}`)
    console.log(`   - 题目: ${exportData.prompts.length}`)
    console.log(`   - 邀请: ${exportData.invitations.length}`)
    
  } catch (error) {
    console.error('❌ 导出失败:', error.message)
    process.exit(1)
  }
}

exportData()

