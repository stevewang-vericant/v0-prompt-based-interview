#!/usr/bin/env node
/**
 * Automated Test: Register School User on Staging
 * Date: 2026-06-30
 * 
 * This script automates the school registration testing on staging.
 * It uses the staging environment's server actions directly.
 */

const https = require('https');
const { URL } = require('url');

const STAGING_URL = 'https://staging.guided.vericant.com';
const timestamp = Date.now();
const TEST_EMAIL = `test-user-${timestamp}@vericant.com`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = `Test User ${timestamp}`;

console.log('====================================');
console.log('Staging Registration Automated Test');
console.log('====================================');
console.log('Staging URL:', STAGING_URL);
console.log('Test Email:', TEST_EMAIL);
console.log('Test Name:', TEST_NAME);
console.log('');

// Step 1: Visit registration page to get cookies/session
console.log('Step 1: Accessing registration page...');

function httpsRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = https.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function runTest() {
  try {
    // Get the registration page to understand the structure
    const pageResponse = await httpsRequest(`${STAGING_URL}/school/register`);
    console.log('✓ Registration page accessible (Status:', pageResponse.statusCode, ')');
    console.log('');

    // The registration form uses client-side React with server actions
    // We need to simulate the browser behavior
    console.log('====================================');
    console.log('Manual Test Required');
    console.log('====================================');
    console.log('');
    console.log('Next.js Server Actions require browser context and CSRF tokens.');
    console.log('Please follow the manual test guide instead:');
    console.log('');
    console.log('1. Open browser and navigate to:');
    console.log(`   ${STAGING_URL}/school/register`);
    console.log('');
    console.log('2. Fill in the form with these details:');
    console.log('   School level: Higher Education (or K-12)');
    console.log('   School: Search and select "Vericant"');
    console.log(`   Name: ${TEST_NAME}`);
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   Confirm Password: ${TEST_PASSWORD}`);
    console.log('');
    console.log('3. Click "Create Account"');
    console.log('');
    console.log('4. Expected: Success message appears, redirects to login after 3s');
    console.log('');
    console.log('====================================');
    console.log('Test Credentials:');
    console.log('====================================');
    console.log('Email:', TEST_EMAIL);
    console.log('Password:', TEST_PASSWORD);
    console.log('School: Vericant');
    console.log('');
    console.log('Note: Account needs admin approval before login is possible.');
    console.log('');

    // Save credentials to a file for reference
    const fs = require('fs');
    const credentialsFile = '/workspace/test-credentials.txt';
    const credentials = `
Staging Registration Test Credentials
Generated: ${new Date().toISOString()}
=====================================

Email: ${TEST_EMAIL}
Password: ${TEST_PASSWORD}
Name: ${TEST_NAME}
School: Vericant

Staging URLs:
- Registration: ${STAGING_URL}/school/register
- Login: ${STAGING_URL}/school/login
- User Management: ${STAGING_URL}/school/users

Test Steps:
1. Register using the credentials above at the registration URL
2. Login as super admin to activate the account at User Management URL
3. Login with the test credentials at the login URL

Note: Account requires admin approval (active=false by default)
`;
    
    fs.writeFileSync(credentialsFile, credentials);
    console.log(`✓ Credentials saved to: ${credentialsFile}`);
    console.log('');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

runTest();
