# Feature Flag Guide — Edge Approval

**Flag:** `VITE_ENABLE_EDGE_APPROVAL`
**Type:** Environment variable (build-time)
**Default:** `false` (legacy path)

---

## How It Works

The feature flag is read at runtime via `import.meta.env.VITE_ENABLE_EDGE_APPROVAL`.

```typescript
// src/config/features.ts
export const features = {
  get edgeApproval(): boolean {
    return import.meta.env.VITE_ENABLE_EDGE_APPROVAL === 'true'
  },
}
```

When `applicationService.approveApplication(id)` is called:
- If `features.edgeApproval === true` → calls `approveApplicationViaEdge(id)` (Edge Function)
- If `features.edgeApproval === false` → calls the existing legacy provisioning code

## Setting the Flag

### Production
```bash
# Enable Edge Function approval
VITE_ENABLE_EDGE_APPROVAL=true

# Disable (use legacy)
VITE_ENABLE_EDGE_APPROVAL=false
```

### Development
```bash
# .env.local
VITE_ENABLE_EDGE_APPROVAL=true
```

## Rollback Procedure

Rollback requires less than 5 minutes:

1. **Disable the flag:**
   ```bash
   VITE_ENABLE_EDGE_APPROVAL=false
   ```

2. **Redeploy the frontend:**
   ```bash
   npm run build
   # Deploy build output to hosting
   ```

3. **Verify:**
   - The approve button immediately uses the legacy browser-side path
   - All existing functionality preserved
   - No code changes or deletions needed

4. **Investigate** the Edge Function behavior without production impact.

## Canary Testing

To test with a subset of users:
1. Deploy the Edge Function to Supabase
2. Set `VITE_ENABLE_EDGE_APPROVAL=true` in a staging/preview environment
3. Test with mentor accounts
4. When verified, roll to production

## Safety

- The legacy path is NEVER removed — it remains as the default
- The flag can be toggled at any time
- No data migration needed (both paths write to the same schema)
- The Edge Function handles idempotency (cannot double-create)
