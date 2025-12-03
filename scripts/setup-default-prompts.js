/**
 * 设置默认题目并为现有学校分配
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupDefaultPrompts() {
  console.log('🔧 Setting up default prompts...\n')

  try {
    // 1. 检查是否有系统默认题目
    const existingDefaults = await prisma.prompt.findMany({
      where: { school_id: null },
      orderBy: { created_at: 'asc' }
    })

    console.log(`📋 Found ${existingDefaults.length} default prompts`)

    // 2. 如果没有足够的默认题目，创建一些
    if (existingDefaults.length < 4) {
      console.log('⚠️  Not enough default prompts, creating...')
      
      const defaultPrompts = [
        {
          category: 'Conversational Fluency',
          prompt_text: 'Tell me about your favorite hobby and why you enjoy it.',
          preparation_time: 20,
          response_time: 90,
          difficulty_level: 'easy',
          is_active: true,
          school_id: null
        },
        {
          category: 'Critical Thinking',
          prompt_text: 'Describe a time when you had to solve a complex problem. What approach did you take and what was the outcome?',
          preparation_time: 20,
          response_time: 90,
          difficulty_level: 'medium',
          is_active: true,
          school_id: null
        },
        {
          category: 'General Knowledge',
          prompt_text: 'What do you think is the most important global challenge facing our generation?',
          preparation_time: 20,
          response_time: 90,
          difficulty_level: 'medium',
          is_active: true,
          school_id: null
        },
        {
          category: 'Critical Thinking',
          prompt_text: 'Describe a situation where you had to work with someone whose perspective was very different from yours. How did you handle it?',
          preparation_time: 20,
          response_time: 90,
          difficulty_level: 'medium',
          is_active: true,
          school_id: null
        }
      ]

      // 只创建缺失的
      const toCreate = defaultPrompts.slice(existingDefaults.length)
      for (const prompt of toCreate) {
        await prisma.prompt.create({ data: prompt })
        console.log(`  ✓ Created: ${prompt.category} - ${prompt.prompt_text.substring(0, 50)}...`)
      }
    }

    // 3. 重新获取所有默认题目
    const allDefaults = await prisma.prompt.findMany({
      where: { school_id: null },
      orderBy: { created_at: 'asc' },
      take: 4
    })

    if (allDefaults.length < 4) {
      console.error('❌ Still not enough default prompts!')
      return
    }

    const defaultPromptIds = allDefaults.map(p => p.id)
    console.log(`\n✅ Default prompts ready (${defaultPromptIds.length} prompts)`)

    // 4. 为没有配置题目的学校设置默认题目
    // 获取所有非超级管理员的学校
    const allSchools = await prisma.school.findMany({
      where: {
        is_super_admin: false
      },
      select: {
        id: true,
        name: true,
        code: true,
        selected_prompt_ids: true
      }
    })

    // 过滤出没有配置题目的学校
    const schoolsWithoutPrompts = allSchools.filter(school => 
      !school.selected_prompt_ids || school.selected_prompt_ids.length === 0
    )

    console.log(`\n🏫 Found ${schoolsWithoutPrompts.length} schools without prompts`)

    for (const school of schoolsWithoutPrompts) {
      await prisma.school.update({
        where: { id: school.id },
        data: { selected_prompt_ids: defaultPromptIds }
      })
      console.log(`  ✓ Set default prompts for: ${school.name} (${school.code})`)
    }

    console.log('\n✅ Setup complete!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupDefaultPrompts()

