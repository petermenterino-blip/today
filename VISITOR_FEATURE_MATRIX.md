# Visitor Feature Matrix

| Feature | Status | Evidence | Missing evidence / recommended action | Priority |
|---|---|---|---|---|
| Landing page | PASS | Playwright landing load and console tests | Screenshots in `screenshots/` | Medium |
| Authentication page | PASS | Login form rendered; real seeded logins succeeded in setup | Add reset/invitation cases | High |
| Application form access/required validation | PASS | Two Playwright tests | Add field boundary matrix | High |
| Protected mentor/student routes | PASS | Anonymous redirect tests | Add every protected deep link | Critical |
| About, Programs, Resources, Gallery, Contact, FAQ | PARTIAL | Landing/navigation only | Exercise every link, button, form and response | High |
| Invitation, password reset | PARTIAL | Not executed | Execute real email/token lifecycle | Critical |
| Privacy, Terms, 404 | PARTIAL | Not executed | Add route/content/link assertions | Medium |
| Responsive/a11y/SEO/images/performance | PARTIAL | Existing static screenshots only | Run axe, metadata/image/link audit and Web Vitals | High |
| Upload and email submission | PARTIAL | Real buckets exist | Submit actual files/email and verify database/storage/provider | Critical |

Console/network logs are in the Playwright report. No failure trace/video exists because no browser test retried.
