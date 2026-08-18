#!/usr/bin/env node

/**
 * Google OAuth Setup Test
 * Quick verification script for Parliament Explorer authentication
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Parliament Explorer - Google OAuth Setup Verification\n');

// Check frontend environment
const frontendEnvPath = path.join(__dirname, '.env.local');
const backendEnvPath = path.join(__dirname, 'cloud-run-api', '.env.local');

console.log('📁 Checking Environment Files...');

if (fs.existsSync(frontendEnvPath)) {
    console.log('✅ Frontend .env.local found');
    const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
    if (frontendEnv.includes('VITE_GOOGLE_CLIENT_ID=your_client_id_here')) {
        console.log('⚠️  Frontend: Please update VITE_GOOGLE_CLIENT_ID with your actual Google Client ID');
    } else if (frontendEnv.includes('VITE_GOOGLE_CLIENT_ID=')) {
        console.log('✅ Frontend: Google Client ID configured');
    } else {
        console.log('❌ Frontend: VITE_GOOGLE_CLIENT_ID not found');
    }
} else {
    console.log('❌ Frontend .env.local not found');
}

if (fs.existsSync(backendEnvPath)) {
    console.log('✅ Backend .env.local found');
    const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
    if (backendEnv.includes('GOOGLE_CLIENT_ID=your_client_id_here')) {
        console.log('⚠️  Backend: Please update GOOGLE_CLIENT_ID with your actual Google Client ID');
    } else if (backendEnv.includes('GOOGLE_CLIENT_ID=')) {
        console.log('✅ Backend: Google Client ID configured');
    } else {
        console.log('❌ Backend: GOOGLE_CLIENT_ID not found');
    }
} else {
    console.log('❌ Backend .env.local not found');
}

console.log('\n📋 Next Steps:');
console.log('1. Replace "your_client_id_here.apps.googleusercontent.com" with your actual Google Client ID');
console.log('2. Update other environment variables as needed');
console.log('3. Run: npm run dev (in one terminal)');
console.log('4. Run: cd cloud-run-api && npm run dev (in another terminal)');
console.log('5. Visit: http://localhost:5173 to test Google OAuth');

console.log('\n🔗 Resources:');
console.log('- Setup Guide: ./GOOGLE_OAUTH_SETUP_GUIDE.md');
console.log('- Google Cloud Console: https://console.cloud.google.com/');

console.log('\n🎯 Testing Checklist:');
console.log('□ Google Cloud Console configured');
console.log('□ Environment variables updated');
console.log('□ Both servers running');
console.log('□ Google OAuth button appears');
console.log('□ Google sign-in popup works');
console.log('□ MFA setup required for new users');
console.log('□ User profile shows authentication provider');