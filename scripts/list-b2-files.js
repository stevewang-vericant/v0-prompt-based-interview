#!/usr/bin/env node

/**
 * 快速查看 B2 bucket 中的文件列表
 * 使用方法: node scripts/list-b2-files.js [path]
 * 例如: node scripts/list-b2-files.js interviews/
 */

const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
require('dotenv').config({ path: '.env.local' });

// 配置 B2 客户端
const s3Client = new S3Client({
  endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
  region: process.env.B2_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  forcePathStyle: true,
});

async function listFiles(prefix = '') {
  try {
    console.log(`\n📦 Bucket: ${process.env.B2_BUCKET_NAME}`);
    console.log(`📁 Path: ${prefix || '(root)'}\n`);
    console.log('Fetching files...\n');

    const command = new ListObjectsV2Command({
      Bucket: process.env.B2_BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ No files found\n');
      return;
    }

    // 按最后修改时间排序（最新的在前）
    const sortedFiles = response.Contents.sort((a, b) => {
      return new Date(b.LastModified) - new Date(a.LastModified);
    });

    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ Files (sorted by newest first)                                             │');
    console.log('├─────────────────────────────────────────────────────────────────────────────┤');

    sortedFiles.forEach((file, index) => {
      const size = formatSize(file.Size);
      const date = new Date(file.LastModified).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      
      const fileName = file.Key.split('/').pop() || file.Key;
      const path = file.Key.substring(0, file.Key.lastIndexOf('/') + 1);
      const url = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${file.Key}`;
      
      console.log(`│ ${(index + 1).toString().padStart(2)}. ${fileName.padEnd(40)} │`);
      console.log(`│     📏 Size: ${size.padEnd(10)} 📅 ${date.padEnd(24)} │`);
      if (path) {
        console.log(`│     📂 ${path.padEnd(57)} │`);
      }
      console.log(`│     🔗 ${url.padEnd(58)} │`);
      console.log('├─────────────────────────────────────────────────────────────────────────────┤');
    });

    console.log(`│ Total: ${sortedFiles.length} file(s)${' '.repeat(63)} │`);
    console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('credentials')) {
      console.error('\n💡 提示: 请检查 .env.local 文件中的 B2 credentials 是否正确配置');
    }
    process.exit(1);
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 获取命令行参数
const prefix = process.argv[2] || '';

// 运行
listFiles(prefix);

