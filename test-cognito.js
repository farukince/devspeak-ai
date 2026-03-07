// Cognito Test Script - Simple Version
// Run: node test-cognito.js

const fs = require('fs');

console.log('🔍 Cognito Configuration Test\n');
console.log('================================\n');

// Read .env.local file
let envContent = '';
try {
  envContent = fs.readFileSync('.env.local', 'utf8');
} catch (error) {
  console.log('❌ Cannot read .env.local file');
  process.exit(1);
}

// Parse environment variables
const env = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Check required variables
const checks = [
  { name: 'User Pool ID', key: 'NEXT_PUBLIC_COGNITO_USER_POOL_ID' },
  { name: 'Client ID', key: 'NEXT_PUBLIC_COGNITO_CLIENT_ID' },
  { name: 'Identity Pool ID', key: 'NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID' },
  { name: 'Domain', key: 'NEXT_PUBLIC_COGNITO_DOMAIN' },
  { name: 'App URL', key: 'NEXT_PUBLIC_APP_URL' },
  { name: 'AWS Region', key: 'AWS_REGION' },
  { name: 'AWS Access Key', key: 'AWS_ACCESS_KEY_ID' },
  { name: 'AWS Secret Key', key: 'AWS_SECRET_ACCESS_KEY' },
];

let allPassed = true;

checks.forEach(check => {
  const value = env[check.key];
  const status = value ? '✅' : '❌';
  const displayValue = check.key.includes('SECRET') && value 
    ? '***' + value.slice(-4) 
    : (value || 'NOT SET');
  console.log(`${status} ${check.name}: ${displayValue}`);
  if (!value) allPassed = false;
});

console.log('\n================================\n');

if (allPassed) {
  console.log('✅ All Cognito configuration values are set!\n');
  console.log('📝 Configuration Summary:');
  console.log(`   Region: ${env.AWS_REGION}`);
  console.log(`   User Pool: ${env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}`);
  console.log(`   Domain: ${env.NEXT_PUBLIC_COGNITO_DOMAIN}`);
  console.log('\n🚀 You can now test the login page!');
  console.log('   Run: npm run dev');
  console.log('   Open: http://localhost:3000/login\n');
} else {
  console.log('❌ Some configuration values are missing!');
  console.log('   Please check your .env.local file\n');
  process.exit(1);
}

// Validate format
console.log('🔍 Format Validation:\n');

const userPoolId = env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
if (userPoolId) {
  const isValid = /^[a-z]+-[a-z]+-\d+_[a-zA-Z0-9]+$/.test(userPoolId);
  console.log(`${isValid ? '✅' : '❌'} User Pool ID format: ${isValid ? 'Valid' : 'Invalid (should be like: eu-central-1_XXXXXXXXX)'}`);
}

const identityPoolId = env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID;
if (identityPoolId) {
  const isValid = /^[a-z]+-[a-z]+-\d+:[a-f0-9-]+$/.test(identityPoolId);
  console.log(`${isValid ? '✅' : '❌'} Identity Pool ID format: ${isValid ? 'Valid' : 'Invalid (should be like: eu-central-1:xxxx-xxxx-xxxx-xxxx)'}`);
}

const domain = env.NEXT_PUBLIC_COGNITO_DOMAIN;
if (domain) {
  const hasHttps = domain.startsWith('https://');
  console.log(`${!hasHttps ? '✅' : '⚠️'} Domain format: ${!hasHttps ? 'Correct (no https://)' : 'Warning: Remove https:// from domain'}`);
}

console.log('\n================================');
console.log('✅ Cognito configuration looks good!');
console.log('================================\n');
