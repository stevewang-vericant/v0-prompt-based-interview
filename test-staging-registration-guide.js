#!/usr/bin/env node
/**
 * Manual Test Guide: Register School User on Staging
 * Date: 2026-06-30
 * 
 * This guide helps you manually test the school registration flow on staging.
 */

const STAGING_URL = 'https://staging.guided.vericant.com';
const timestamp = Date.now();

console.log('====================================');
console.log('Staging Registration Test Guide');
console.log('====================================');
console.log('');
console.log('Target Environment: Staging');
console.log(`URL: ${STAGING_URL}/school/register`);
console.log('');
console.log('====================================');
console.log('Test Steps:');
console.log('====================================');
console.log('');
console.log('1. Open your browser and navigate to:');
console.log(`   ${STAGING_URL}/school/register`);
console.log('');
console.log('2. Fill in the registration form:');
console.log('   - School level: Choose "Higher Education" or "K-12"');
console.log('   - School: Type "vericant" in the search box');
console.log('   - Select "Vericant" from the dropdown');
console.log('   - Your Name: Test User ' + timestamp);
console.log('   - Email: test-user-' + timestamp + '@vericant.com');
console.log('   - Password: TestPass123!');
console.log('   - Confirm Password: TestPass123!');
console.log('');
console.log('3. Click "Create Account" button');
console.log('');
console.log('4. Expected Result:');
console.log('   - Success message should appear');
console.log('   - Message: "Your account has been created and is pending approval"');
console.log('   - Page will redirect to login page after 3 seconds');
console.log('');
console.log('5. Verify in Database (SSH to staging):');
console.log('   ssh guided-staging');
console.log('   su - v0-interview');
console.log('   cd /home/v0-interview/apps/v0-interview');
console.log('   docker compose -f docker-compose.linode.yml exec -T interview-db \\');
console.log('     psql -U postgres -d postgres -c \\');
console.log(`     "SELECT id, email, name, active, school_id FROM school_admins WHERE email = 'test-user-${timestamp}@vericant.com';"`);
console.log('');
console.log('6. Activate the account (as super admin):');
console.log(`   - Login to ${STAGING_URL}/school/login as super admin`);
console.log(`   - Navigate to ${STAGING_URL}/school/users`);
console.log('   - Find the newly registered user');
console.log('   - Click "Activate" button');
console.log('');
console.log('7. Test Login:');
console.log(`   - Go to ${STAGING_URL}/school/login`);
console.log('   - Email: test-user-' + timestamp + '@vericant.com');
console.log('   - Password: TestPass123!');
console.log('   - Should successfully login and see dashboard');
console.log('');
console.log('====================================');
console.log('Test Credentials Generated:');
console.log('====================================');
console.log('Email:', 'test-user-' + timestamp + '@vericant.com');
console.log('Password: TestPass123!');
console.log('School: Vericant');
console.log('');
console.log('====================================');
console.log('Note: Account requires admin approval');
console.log('====================================');
