# Storage Configuration

## Bucket Summary

| ID | Name | Public | File Size Limit | Created In |
|----|------|--------|-----------------|------------|
| profile-avatars | profile-avatars | ✅ Yes | 5MB (5,242,880) | 014_storage (updated in 029) |
| student-documents | student-documents | ❌ No | 10MB (10,485,760) | 014_storage |
| mentor-resources | mentor-resources | ❌ No | 100MB (104,857,600) | 014_storage (updated in 023_resources) |
| gallery-images | gallery-images | ✅ Yes | 5MB (5,242,880) | 014_storage |
| message-attachments | message-attachments | ❌ No | 25MB (26,214,400) | 030_messaging_fixes |
| shared_files | shared_files | ❌ No | 50MB (52,428,800) | 020_module6_complete |
| public-website | public-website | ✅ Yes | 10MB (10,485,760) | 030_messaging_fixes |

## Bucket Policies

### profile-avatars
| Policy | Action | User | Rule |
|--------|--------|------|------|
| avatars_public_read | SELECT | public | bucket_id = 'profile-avatars' |
| avatars_owner_write | INSERT | authenticated | folder[1] = auth.uid() |
| avatars_owner_update | UPDATE | authenticated | folder[1] = auth.uid() |
| avatars_owner_delete | DELETE | authenticated | folder[1] = auth.uid() |

### student-documents
| Policy | Action | User | Rule |
|--------|--------|------|------|
| docs_student_write | INSERT | authenticated | folder[1] = auth.uid() |
| docs_student_read_own | SELECT | authenticated | folder[1] = auth.uid() |
| docs_mentor_read_assigned | SELECT | authenticated | mentor of student via program_enrollments |
| docs_owner_delete | DELETE | authenticated | folder[1] = auth.uid() |
| docs_anon_upload_applications | INSERT | public | folder[1] = 'applications' |
| docs_anon_read_applications | SELECT | public | folder[1] = 'applications' |

### mentor-resources
| Policy | Action | User | Rule |
|--------|--------|------|------|
| resources_mentor_write | INSERT | authenticated | role = 'mentor' |
| resources_mentor_update | UPDATE | authenticated | role = 'mentor' |
| resources_mentor_delete | DELETE | authenticated | role = 'mentor' |
| resources_auth_read | SELECT | authenticated | bucket_id = 'mentor-resources' |

### gallery-images
| Policy | Action | User | Rule |
|--------|--------|------|------|
| gallery_public_read | SELECT | public | bucket_id = 'gallery-images' |
| gallery_mentor_write | INSERT | authenticated | role = 'mentor' |
| gallery_mentor_delete | DELETE | authenticated | role = 'mentor' |

### message-attachments
| Policy | Action | User | Rule |
|--------|--------|------|------|
| msg_attach_sender_write | INSERT | authenticated | folder[1] = auth.uid() |
| msg_attach_sender_update | UPDATE | authenticated | folder[1] = auth.uid() |
| msg_attach_sender_delete | DELETE | authenticated | folder[1] = auth.uid() |
| msg_attach_participant_read | SELECT | authenticated | participant in conversation |

### shared_files
(Set up in 020_module6_complete.sql — policies set there)

### public-website
| Policy | Action | User | Rule |
|--------|--------|------|------|
| public_website_read | SELECT | public | bucket_id = 'public-website' |
| public_website_write | INSERT | authenticated | bucket_id = 'public-website' |

## Folder Structure Conventions

- **profile-avatars:** `{userId}/{filename}`
- **student-documents:** `{userId}/{filename}` or `applications/{filename}` (anonymous uploads)
- **mentor-resources:** `{userId}/{filename}` or `{category}/{filename}`
- **gallery-images:** `{category}/{filename}`
- **message-attachments:** `{userId}/{filename}`
- **shared_files:** `{conversationId}/{filename}`

## MIME Type Allowed per Bucket

### profile-avatars
`image/png`, `image/jpeg`, `image/gif`, `image/webp`

### student-documents
`application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/png`, `image/jpeg`

### mentor-resources
`application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/zip`, `application/x-zip-compressed`, `image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `image/gif`, `image/svg+xml`, `video/mp4`, `video/webm`, `video/quicktime`, `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/mp4`, `text/plain`, `text/markdown`, `text/csv`, `application/json`

### gallery-images
`image/png`, `image/jpeg`, `image/gif`, `image/webp`

### message-attachments
`application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`, `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `application/zip`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`, `audio/webm`, `audio/mp4`, `video/mp4`, `video/webm`, `video/ogg`

### public-website
`image/png`, `image/jpeg`, `image/webp`, `application/pdf`
