# Vercel Deployment Guide

## Build Process Differences Fixed

This document outlines the changes made to ensure consistent builds between your local environment and Vercel.

### Key Improvements

1. **NPM Configuration (.npmrc)**
   - Ensures consistent dependency resolution
   - Handles peer dependency issues gracefully
   - Improves build performance with better timeouts

2. **Vite Configuration (vite.config.ts)**
   - Explicit optimization of dependencies for pre-bundling
   - Consistent minification settings
   - Proper source map handling
   - Better chunk splitting for Firebase and UI libraries

3. **Build Verification (scripts/verify-build.js)**
   - Checks environment variables before build
   - Validates TypeScript configuration
   - Ensures all necessary files exist
   - Runs TypeScript compilation check

4. **Environment Setup (.env.example)**
   - Documents all required Firebase environment variables
   - Makes setup clear for new developers

### Before Deploying to Vercel

#### Step 1: Set Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following environment variables from your Firebase project:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

#### Step 2: Verify Build Locally
```bash
npm run build:verify
npm run build
npm run preview
```

#### Step 3: Test in Production Mode
```bash
npm run build
# Open dist/index.html in a browser via a local server
npx serve dist
```

### Vercel Project Settings

Ensure your Vercel project has these settings:

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher (recommended 20.x)

### Environment Variables Setup

Your `.env.local` file should look like:
```
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Troubleshooting

#### Issue: "Cannot read properties of undefined (reading 'createContext')"
**Solution**: This is now fixed by:
- Correct React import in AppContext.tsx
- Proper React pre-bundling in Vite config
- vercelSetup.ts ensuring React loads first

#### Issue: Build succeeds locally but fails on Vercel
**Solution**:
1. Run `npm run build:verify` to check configuration
2. Check Vercel build logs for specific errors
3. Ensure all environment variables are set correctly
4. Clear Vercel cache and redeploy

#### Issue: Environment variables not loading
**Solution**:
1. Verify variable names match exactly (case-sensitive)
2. Check they're set in Vercel project settings (not just local)
3. Prefix must be `VITE_` for client-side variables
4. Redeploy after changing environment variables

### Build Output

After running `npm run build`, you should see:
```
dist/
├── index.html
├── assets/
│   ├── index-XXXXX.js (main app bundle)
│   ├── vendor-react-XXXXX.js
│   ├── vendor-firebase-XXXXX.js
│   ├── vendor-router-XXXXX.js
│   └── index-XXXXX.css
└── ...
```

### Performance Optimization

The new Vite config optimizes for Vercel by:
- Pre-bundling React and React DOM (avoid cold starts)
- Splitting Firebase into its own chunk (faster updates to app logic)
- Separating UI library (Radix UI) from main bundle
- Using esbuild minification for faster builds

### If Issues Persist

1. **Check Node version**: `node --version` (should be 18+)
2. **Verify npm version**: `npm --version` (should be 8+)
3. **Clear caches**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
4. **Check for conflicting extensions**: Disable browser extensions and try again
5. **View Vercel build logs**: Check the detailed build logs in Vercel dashboard

### Deployment Command

On Vercel, your build command should be set to:
```
npm run build
```

This will automatically run the verification script as a pre-step.

---

Last updated: October 23, 2025
