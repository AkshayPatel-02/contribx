# Pre-Deployment Checklist

- [ ] All environment variables are set in `.env.local`
- [ ] Run `npm run build:verify` and all checks pass
- [ ] Run `npm run build` successfully
- [ ] Run `npm run preview` and test the app works
- [ ] Check browser console for errors
- [ ] Verify Firebase connection works
- [ ] Test occupy/close issue functionality
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Git changes are committed and pushed
- [ ] Environment variables are added to Vercel project settings:
  - [ ] VITE_FIREBASE_API_KEY
  - [ ] VITE_FIREBASE_AUTH_DOMAIN
  - [ ] VITE_FIREBASE_PROJECT_ID
  - [ ] VITE_FIREBASE_STORAGE_BUCKET
  - [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
  - [ ] VITE_FIREBASE_APP_ID
- [ ] Vercel build command is set to `npm run build`
- [ ] Vercel output directory is set to `dist`
- [ ] Node version on Vercel is 18.x or higher
- [ ] Deploy to Vercel
- [ ] Test deployed app in production
- [ ] Check Vercel deployment logs for any warnings
- [ ] Monitor browser console on deployed app for errors

## Quick Commands

```bash
# Run local verification
npm run build:verify

# Build locally
npm run build

# Preview production build
npm run preview

# Check TypeScript
npx tsc --noEmit
```
