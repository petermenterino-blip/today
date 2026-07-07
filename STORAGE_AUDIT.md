# Storage Audit

**Date:** 2026-07-06  
**Environment:** Staging (rpxcrgpxyuvhnhnopvpa.supabase.co)

---

## 1. Bucket Inventory

| Bucket | Public | Size Limit | MIME Types | Migration |
|--------|--------|------------|------------|-----------|
| `profile-avatars` | ✅ Public | 2 MB | png, jpeg, gif, webp | 014_storage.sql |
| `student-documents` | ❌ Private | 10 MB | pdf, doc, docx, png, jpeg | 014_storage.sql |
| `mentor-resources` | ❌ Private | 50 MB | pdf, zip, mp4, png, jpeg, webp | 014_storage.sql |
| `gallery-images` | ✅ Public | 5 MB | png, jpeg, gif, webp | 014_storage.sql |
| `message-attachments` | ❌ Private | 25 MB | pdf, doc, txt, images, zip, ppt, xls, audio, video | 0302_messaging_fixes.sql |
| `shared_files` | ❌ Private | 50 MB | pdf, doc, docx, ppt, png, jpeg, gif, webp, zip, txt | **RUNTIME** (not in migrations) |

---

## 2. RLS Policy Coverage

| Bucket | Policies | Coverage |
|--------|----------|----------|
| profile-avatars | Public read, owner write/update/delete | ✅ Complete |
| student-documents | Student write own, student read own, mentor read assigned, anon upload to applications/, auth read applications/ | ✅ Complete |
| mentor-resources | Mentor write/update/delete, authenticated read | ✅ Complete |
| gallery-images | Public read, mentor write/delete | ✅ Complete |
| message-attachments | Sender write/update/delete, participant read (via conversation join) | ✅ Complete |
| shared_files | **MISSING** — No storage-level RLS defined; bucket created at runtime | ⚠️ Partial |

---

## 3. Service Layer Audit

### `storageService.ts` (src/services/storageService.ts)
- **Status:** ⚠️ **DEAD CODE** — Imported once but methods are never called
- `upload()` — Uses `compressImage`, generates path `{userId}/{timestamp}_{sanitizedName}`
- `getPublicUrl()` — Standard public URL generation
- `getSignedUrl()` — Signed URL with configurable expiry
- `delete()` — URL path extraction via `url.split('/').slice(-2).join('/')` (fragile)
- `listFiles()` — Lists user's files with signed URLs

### `sharedFilesService.ts` (src/services/sharedFilesService.ts)
- **Status:** ✅ ACTIVE — Handles all shared file operations
- Uses its own bucket `shared_files` (created at runtime via `ensureBucket()`)
- `upload()` — Validates type + size, stores to `shared_files` bucket, creates DB record with signed URL
- `getSignedUrl()` — Signed URL generation
- `delete()` — Removes from storage + soft-deletes DB record
- `replace()` — Removes old + uploads new (uses `upsert: true` for same path)
- `rename()` — Updates DB record name only
- `getDownloadUrl()` — Signed URL for download

---

## 4. Upload Validation

| Check | Implementation | Status |
|-------|---------------|--------|
| File size limit | 50MB in `sharedFilesService`, varies per bucket in storage config | ✅ |
| MIME type validation | Whitelist in `sharedFilesService.ALLOWED_TYPES` | ✅ |
| File name sanitization | `file.name.replace(/[^a-zA-Z0-9._-]/g, '_')` | ✅ |
| Image compression | `compressImage()` for avatars (400px, 1MB) and gallery (1920px, 3MB) | ✅ |
| Virus scanning | ❌ NOT IMPLEMENTED | ⚠️ Missing — upload to dedicated bucket with AV scan |

---

## 5. Download Validation

| Check | Implementation | Status |
|-------|---------------|--------|
| Public bucket access | Direct public URL via Supabase CDN | ✅ |
| Private bucket access | Signed URLs with expiry (7 days default) | ✅ |
| Download URL expiry | `createSignedUrl(storagePath, 3600)` = 1 hour for direct download | ✅ |
| Cross-student isolation | Folder prefix `{userId}/` enforced by RLS | ✅ |
| Broken URL handling | Service methods throw on failure, caught by callers | ✅ |

---

## 6. Deletion Validation

| Check | Implementation | Status |
|-------|---------------|--------|
| Storage object delete | `supabase.storage.from(bucket).remove([path])` | ✅ |
| DB soft-delete | Sets `deleted_at` timestamp (not hard delete) | ✅ |
| Cascade on user delete | ⚠️ Users may leave orphan storage objects | ⚠️ Not handled |

---

## 7. Issues Found

| Severity | Issue | Location | Impact |
|----------|-------|----------|--------|
| MEDIUM | `storageService.ts` is dead code — imported but never used | `src/services/storageService.ts` (all methods), `src/services/sharedFilesService.ts:2` | 88 lines unused; `delete()` method has fragile URL parsing |
| MEDIUM | `shared_files` bucket created at runtime, not in migrations | `src/services/sharedFilesService.ts:71-82` | Bucket won't exist in production unless first upload triggers `ensureBucket()` |
| LOW | No storage-level RLS for `shared_files` bucket | `sharedFilesService.ts` | Relies on bucket being private and signed URLs; no policy in migrations |
| LOW | No virus scanning on uploaded files | All upload paths | Risk mitigated by MIME type validation, but not fully protected |
| INFO | `storageService.delete()` uses fragile path extraction | `storageService.ts:66` | `url.split('/').slice(-2).join('/')` breaks if URL structure changes |

---

## 8. Recommendations

| Priority | Action | Details |
|----------|--------|---------|
| HIGH | Add `shared_files` bucket to storage migration | Copy bucket config from `sharedFilesService.ensureBucket()` into migration 014 or add new migration |
| MEDIUM | Remove dead `storageService.ts` or consolidate with `sharedFilesService.ts` | Two parallel storage implementations cause confusion |
| LOW | Add storage-level RLS for `shared_files` | Add policy in migration to match `sharedFilesService` access pattern |
| LOW | Add orphan cleanup cron job | Remove storage objects when parent user/profile is deleted |

---

## Summary

✅ **PASS** — Storage is functional with proper access controls. One dead code file (`storageService.ts`). One runtime-created bucket (`shared_files`) that should be in migrations. No critical storage vulnerabilities.
