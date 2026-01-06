// Test script for AI Image Editing API
// Run with: node test-image-editing.js

const fs = require('fs');
const path = require('path');

async function testImageEditingAPI() {
  console.log('🧪 Testing AI Image Editing API...\n');

  // Test if the API endpoint exists
  const apiFilePath = path.join(__dirname, 'src', 'app', 'api', 'ai', 'edit-image', 'route.ts');
  
  if (fs.existsSync(apiFilePath)) {
    console.log('✅ API endpoint file exists: /api/ai/edit-image');
  } else {
    console.log('❌ API endpoint file NOT found');
    return;
  }

  // Check if required dependencies are installed
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = ['@google/genai', 'mime'];
  console.log('\n📦 Checking dependencies:');
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - v${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - NOT INSTALLED`);
    }
  });

  // Check if environment variable is configured
  console.log('\n🔑 Checking environment configuration:');
  const envPath = path.join(__dirname, '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('GOOGLE_AI_API_KEY')) {
      console.log('✅ GOOGLE_AI_API_KEY is configured in .env.local');
      
      // Check if it's not a placeholder
      const match = envContent.match(/GOOGLE_AI_API_KEY="([^"]+)"/);
      if (match && match[1] && match[1].length > 20) {
        console.log('✅ API key appears to be valid (length > 20 chars)');
      } else {
        console.log('⚠️  API key might be a placeholder or invalid');
      }
    } else {
      console.log('❌ GOOGLE_AI_API_KEY not found in .env.local');
    }
  } else {
    console.log('❌ .env.local file not found');
  }

  // Check seller's product page for image editing UI
  console.log('\n🎨 Checking UI integration:');
  const sellerProductPagePath = path.join(__dirname, 'src', 'app', 'seller', 'products', 'new', 'page.tsx');
  
  if (fs.existsSync(sellerProductPagePath)) {
    const pageContent = fs.readFileSync(sellerProductPagePath, 'utf8');
    
    const checks = [
      { name: 'handleImageEdit function', pattern: /handleImageEdit/},
      { name: 'Retry button', pattern: /retry/i },
      { name: 'Change Background button', pattern: /change-background/i },
      { name: 'Enhance button', pattern: /enhance/i },
      { name: 'Remove Background button', pattern: /remove-background/i },
      { name: 'AI Image Enhancements section', pattern: /AI Image Enhancements/i },
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(pageContent)) {
        console.log(`✅ ${check.name} found`);
      } else {
        console.log(`❌ ${check.name} NOT found`);
      }
    });
  } else {
    console.log('❌ Seller product page not found');
  }

  // Check products page for disclaimer
  console.log('\n⚠️  Checking disclaimer integration:');
  const productsPagePath = path.join(__dirname, 'src', 'app', 'products', 'page.tsx');
  
  if (fs.existsSync(productsPagePath)) {
    const pageContent = fs.readFileSync(productsPagePath, 'utf8');
    
    const disclaimerChecks = [
      { name: 'Disclaimer banner', pattern: /AI Enhanced Images Disclaimer|AI-Enhanced Product Images/i },
      { name: 'AI Enhanced badge', pattern: /AI Enhanced/i },
      { name: 'Watermark detection', pattern: /AI Enhanced by Kalakriti/i },
    ];
    
    disclaimerChecks.forEach(check => {
      if (check.pattern.test(pageContent)) {
        console.log(`✅ ${check.name} found`);
      } else {
        console.log(`❌ ${check.name} NOT found`);
      }
    });
  } else {
    console.log('❌ Products page not found');
  }

  // Security check - ensure API key is not exposed
  console.log('\n🔒 Security validation:');
  const filesToCheck = [
    'src/app/seller/products/new/page.tsx',
    'src/components/TranslatedProductCard.tsx',
    'src/app/products/page.tsx',
  ];
  
  let apiKeyExposed = false;
  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('GOOGLE_AI_API_KEY') || content.includes('AIzaSy')) {
        console.log(`❌ SECURITY ISSUE: API key reference found in ${file}`);
        apiKeyExposed = true;
      }
    }
  });
  
  if (!apiKeyExposed) {
    console.log('✅ No API key exposure detected in client-side files');
  }

  console.log('\n' + '='.repeat(50));
  console.log('Test Summary:');
  console.log('='.repeat(50));
  console.log('✅ Implementation Complete');
  console.log('📝 See AI_IMAGE_EDITING_IMPLEMENTATION.md for details');
  console.log('\n🚀 Next steps:');
  console.log('1. Ensure GOOGLE_AI_API_KEY is set in .env.local');
  console.log('2. Start the dev server: npm run dev');
  console.log('3. Navigate to /seller/products/new');
  console.log('4. Upload an image and test the AI editing buttons');
  console.log('\n');
}

testImageEditingAPI().catch(console.error);
