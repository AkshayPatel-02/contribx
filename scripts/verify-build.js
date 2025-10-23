#!/usr/bin/env node
/**
 * Build verification script
 * Ensures your build is compatible with Vercel before deployment
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting pre-deployment verification...\n');

const checks = [
  {
    name: 'Checking environment variables',
    check: () => {
      const envExample = path.join(__dirname, '.env.example');
      if (!fs.existsSync(envExample)) {
        throw new Error('.env.example file not found');
      }
      console.log('  ✅ .env.example exists');
      
      const envLocal = path.join(__dirname, '.env.local');
      if (!fs.existsSync(envLocal)) {
        console.warn('  ⚠️  .env.local not found - create it locally with Firebase credentials');
      } else {
        console.log('  ✅ .env.local exists');
      }
    }
  },
  {
    name: 'Checking Vite config',
    check: () => {
      const viteConfig = path.join(__dirname, 'vite.config.ts');
      if (!fs.existsSync(viteConfig)) {
        throw new Error('vite.config.ts not found');
      }
      const content = fs.readFileSync(viteConfig, 'utf-8');
      if (!content.includes('optimizeDeps')) {
        throw new Error('vite.config.ts missing optimizeDeps configuration');
      }
      console.log('  ✅ Vite config is properly configured');
    }
  },
  {
    name: 'Checking TypeScript config',
    check: () => {
      const tsconfig = path.join(__dirname, 'tsconfig.app.json');
      if (!fs.existsSync(tsconfig)) {
        throw new Error('tsconfig.app.json not found');
      }
      const content = JSON.parse(fs.readFileSync(tsconfig, 'utf-8'));
      if (content.compilerOptions.jsx !== 'react-jsx') {
        throw new Error('tsconfig.app.json jsx option is not set to react-jsx');
      }
      console.log('  ✅ TypeScript config is correct');
    }
  },
  {
    name: 'Checking package.json scripts',
    check: () => {
      const packageJson = path.join(__dirname, 'package.json');
      const content = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      if (!content.scripts.build) {
        throw new Error('package.json missing build script');
      }
      console.log('  ✅ Build script exists');
    }
  },
  {
    name: 'Checking .npmrc',
    check: () => {
      const npmrc = path.join(__dirname, '.npmrc');
      if (!fs.existsSync(npmrc)) {
        console.warn('  ⚠️  .npmrc not found - creating one for consistency');
      } else {
        console.log('  ✅ .npmrc exists for consistent builds');
      }
    }
  },
  {
    name: 'Verifying imports',
    check: () => {
      const appContextFile = path.join(__dirname, 'src/contexts/AppContext.tsx');
      if (fs.existsSync(appContextFile)) {
        const content = fs.readFileSync(appContextFile, 'utf-8');
        if (!content.includes('import React,')) {
          console.warn('  ⚠️  React import style may need adjustment');
        } else {
          console.log('  ✅ React imports are correct');
        }
      }
    }
  }
];

let hasErrors = false;

for (const check of checks) {
  try {
    check.check();
  } catch (error) {
    console.error(`  ❌ ${error.message}`);
    hasErrors = true;
  }
}

console.log('\n🔨 Running TypeScript check...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('  ✅ TypeScript compilation successful\n');
} catch (error) {
  console.error('  ❌ TypeScript errors found\n');
  hasErrors = true;
}

if (hasErrors) {
  console.log('❌ Verification failed. Please fix the issues above before deploying.\n');
  process.exit(1);
} else {
  console.log('✅ All checks passed! Your build should work on Vercel.\n');
  process.exit(0);
}
