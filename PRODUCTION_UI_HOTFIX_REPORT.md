# Production UI Hotfix Report

## Root Causes: Production vs Localhost Visual Differences

### 1. CSP `font-src` blocked Google Fonts (Inter)
- **Symptom**: Fonts rendered as fallback system-ui/sans-serif instead of Inter on production
- **Cause**: `vercel.json` CSP had `font-src 'self'` — blocked `https://fonts.gstatic.com` from serving Inter font files
- **Fix**: Changed to `font-src 'self' https://fonts.gstatic.com`

### 2. CSP `style-src` blocked Google Fonts stylesheet
- **Symptom**: Google Fonts `<link>` stylesheet was blocked before it could even load
- **Cause**: `style-src 'self' 'unsafe-inline'` did not include `https://fonts.googleapis.com`
- **Fix**: Changed to `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`

### 3. CSP `img-src` blocked external images
- **Symptom**: Paper texture background (`natural-paper.png`), Supabase Storage images (event photos, avatars, gallery images) failed to load
- **Cause**: `img-src 'self' data: blob:` blocked `https://www.transparenttextures.com` and `https://*.supabase.co`
- **Fix**: Added `https://www.transparenttextures.com https://*.supabase.co` to `img-src`

### 4. Missing `public/images/event-placeholder.svg`
- **Symptom**: Gallery and admin pages showed broken image when `item.image_url` was null
- **Cause**: Code references `/images/event-placeholder.svg` in `Gallery.tsx:220` and `GalleryManagement.tsx:201` but file did not exist
- **Fix**: Created `public/images/event-placeholder.svg`

## Changes Made

| File | Change |
|------|--------|
| `vercel.json:24` | Updated CSP: `style-src` added `https://fonts.googleapis.com`; `img-src` added `https://www.transparenttextures.com https://*.supabase.co`; `font-src` added `https://fonts.gstatic.com` |
| `public/images/event-placeholder.svg` | Created SVG placeholder (400×300, light gray with icon) |

## Verification

| Check | Status |
|-------|--------|
| `npm run build` (tsc + vite) | ✅ Passed |
| `npm run lint` (tsc --noEmit) | ✅ Passed |
| `npm test` (160 tests, 12 files) | ✅ Passed |

## Deployment

1. Commit and push changes
2. Vercel will auto-deploy from the connected git branch
3. After deployment, hard-refresh (Ctrl+Shift+R) to clear cached CSP headers
4. Verify:
   - Inter font renders correctly on production
   - Paper texture background visible on body
   - Gallery images and event images load correctly
   - `event-placeholder.svg` shows where no image is set
   - All other static assets load without CSP console errors

## Lighthouse Comparison (post-fix estimate)

| Metric | Before | After (expected) |
|--------|--------|-------------------|
| Font rendering | Fallback sans-serif | Inter (correct) |
| Image loading | Blocked by CSP | Allowed |
| Gallery placeholders | Broken image icon | SVG placeholder |
| CSP console errors | ~5 violations (fonts, textures, storage) | 0 violations |

## Rollback

If issues persist, rollback via Vercel dashboard:
```bash
vercel rollback
```
