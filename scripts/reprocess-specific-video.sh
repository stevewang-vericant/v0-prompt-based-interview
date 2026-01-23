#!/bin/bash
# Script to reprocess a specific interview video
# Usage: ./reprocess-specific-video.sh <interview_id>

set -e

INTERVIEW_ID="${1:-interview-1768641515832-13na37xei}"

echo "🔄 Reprocessing video for interview: $INTERVIEW_ID"
echo ""

# Run the reprocess API endpoint inside the container
docker compose -f docker-compose.linode.yml exec -T interview-app node -e "
const https = require('https');
const http = require('http');

const data = JSON.stringify({
  interviewId: '$INTERVIEW_ID'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/reprocess-video',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response body:', responseData);
    if (res.statusCode === 200) {
      console.log('✅ Video reprocessed successfully!');
    } else {
      console.log('❌ Failed to reprocess video');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.write(data);
req.end();
"
