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

    // 2. 补充 BASE Testing Question Set（B 列 -> category, C 列 -> prompt_text）
    // 忽略 "Set A/B/C/D" 分组行，仅保留具体题目行
    const sheetPrompts = [
      { category: 'Personal introduction', prompt_text: 'Tell me about yourself and one thing you are proud of.' },
      { category: 'Interest / motivation', prompt_text: 'What is one subject, activity, or hobby you enjoy, and why?' },
      { category: 'Challenge / growth', prompt_text: 'Describe a challenge you faced and how you handled it.' },
      { category: 'School fit', prompt_text: 'What kind of school environment helps you do your best?' },
      { category: 'Self-awareness', prompt_text: 'What is something you are still trying to get better at?' },
      { category: 'Values', prompt_text: 'What qualities do you value most in a friend?' },
      { category: 'Responsibility', prompt_text: 'Tell me about a time when you made a mistake. What did you learn from it?' },
      { category: 'Perspective', prompt_text: 'If someone disagreed with you, how would you try to understand their point of view?' },
      { category: 'Imagination', prompt_text: 'If you could design a new class for your school, what would it be and why?' },
      { category: 'Hypothetical', prompt_text: 'If you could switch places with one person for a day, who would it be and why?' },
      { category: 'Opinion', prompt_text: 'What is one rule that every school should have?' },
      { category: 'Open-ended', prompt_text: 'What is something important about you that a school would not know from your application?' },
      { category: 'Problem-solving', prompt_text: 'Describe a time when you had to solve a problem. What did you do?' },
      { category: 'Teamwork', prompt_text: 'Tell me about a time you worked with others on a group project or activity.' },
      { category: 'Decision-making', prompt_text: 'If you had too much homework and an important activity on the same day, how would you manage your time?' },
      { category: 'Social judgment', prompt_text: 'If you saw a classmate being left out, what would you do?' }
    ]

    let createdCount = 0
    let skippedCount = 0

    for (const item of sheetPrompts) {
      const exists = existingDefaults.some(
        (prompt) => prompt.category === item.category && prompt.prompt_text === item.prompt_text
      )

      if (exists) {
        skippedCount += 1
        continue
      }

      await prisma.prompt.create({
        data: {
          category: item.category,
          prompt_text: item.prompt_text,
          preparation_time: 20,
          response_time: 90,
          difficulty_level: 'medium',
          is_active: true,
          school_id: null
        }
      })
      createdCount += 1
      console.log(`  ✓ Created: ${item.category} - ${item.prompt_text.substring(0, 50)}...`)
    }

    console.log(`\n🧩 BASE sheet prompts synced: ${createdCount} created, ${skippedCount} skipped`)

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

