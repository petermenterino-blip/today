# Realtime Documentation

**Engine:** Supabase Realtime (via PostgreSQL replication)
**Client:** `realtimeManager.ts` — centralized subscription management

---

## Architecture

```
PostgreSQL WAL → supabase_realtime publication → WebSocket → Client
                                                          ↕
                                              realtimeManager.ts
                                              ↕
                                      useSharedRealtimeData()
                                      useSharedSubscription()
                                              ↕
                                      React Query cache invalidation
```

## Key Components

### `useSharedRealtimeData(configs: ChannelEntry[])`
- **Purpose:** Auto-invalidation of React Query caches on DB changes
- **How it works:** Subscribes to `postgres_changes` for each table → on any event → debounced `queryClient.invalidateQueries()`
- **Debounce:** 2000ms delay to batch rapid changes
- **Channel naming:** `rt-data-{table}-{random8chars}`
- **Filtering:** Optional column/value equality filter per channel

### `useSharedSubscription(configs: SubscribeEntry[])`
- **Purpose:** Direct callback on DB changes (for custom handling)
- **How it works:** Same subscription mechanism but invokes a user-provided callback
- **Cleanup:** `cleanup()` method to remove all channels
- **Reconnect:** No-op — Supabase handles reconnection natively

## Tables Published to `supabase_realtime`

| Table | Migration | Auto-Invalidation |
|-------|-----------|------------------|
| messages | 015 | ✅ |
| notifications | 015 | ✅ |
| sessions | 015 | ✅ |
| bookings | 015 | ✅ |
| goals | 021 | ✅ |
| tasks | 021 | ✅ |
| student_progress | 021 | ✅ |
| program_enrollments | 021 | ✅ |
| shared_files | 020 | ✅ |
| student_timeline_events | 020 | ✅ |
| profiles | 021 | ✅ |
| tags | 021 | ✅ |
| student_tags | 021 | ✅ |
| custom_forms | 021 | ✅ |
| form_submissions | 021 | ✅ |
| events | 023_events | ✅ |
| event_attendees | 023_events | ✅ |
| event_waitlist | 023_events | ✅ |
| event_activity | 023_events | ✅ |
| event_comments | 023_events | ✅ |
| event_speakers | 023_events | ✅ |
| event_feedbacks | 023_events | ✅ |
| event_files | 023_events | ✅ |
| resources | 023_resources | ✅ |
| resource_completions | 026 | ✅ |
| reviews | 023_reviews | ✅ |
| gallery | 028 | ✅ |
| applications | 030 | ✅ |
| conversations | 030_messaging_fixes | ✅ |
| conversation_participants | 030_messaging_fixes | ✅ |
| credentials | 029 | ✅ |
| announcements | 021 | ✅ |
| products | 021 | ✅ |
| transactions | 021 | ✅ |
| social_links | 029 | ✅ |
| website_settings | 029 | ✅ |
| mentor_settings | 029 | ✅ |
| student_timeline_events | 030_crm | ✅ |
| dashboard_layouts | 030_crm | ✅ |
| analytics_events | 030_crm | ✅ |

## Subscription Usage in Hooks

| Hook | Tables Subscribed | Pattern |
|------|-------------------|---------|
| useMessaging | messages, conversations | useSharedSubscription |
| useNotifications | notifications | useSharedSubscription |
| useGoals | goals | useSharedRealtimeData |
| useTasks | tasks | useSharedRealtimeData |
| useSessions | sessions | useSharedRealtimeData |
| useEvents | events | useSharedRealtimeData |
| useResources | resources | useSharedRealtimeData |
| useBookings | bookings | useSharedRealtimeData |
| useApplications | applications | useSharedRealtimeData |

## Reconnect & Cleanup

| Behavior | Implementation |
|----------|---------------|
| Native reconnect | Supabase JS client handles WebSocket reconnection |
| Cleanup on unmount | `useEffect` return removes all channels |
| Debounce timers | `Map<string, setTimeout>` — cleared on invalidation |
| Channel errors | Logged as warnings, not re-thrown |
| Duplicate prevention | Config key comparison before re-subscribing |

## Known Limitations

1. **No presence channels** — Real-time presence not implemented
2. **No broadcast channels** — Custom broadcast not used
3. **All channels use `*` event** — No distinction between INSERT/UPDATE/DELETE
4. **Debounce delay** — 2s delay may feel sluggish for some use cases
5. **No channel health monitoring** — No periodic ping/pong
6. **Channel count tracking** — `getActiveChannelCount()` returns 0 (stub)
