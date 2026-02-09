# Multiplayer & Friends System Roadmap

A step-by-step plan to fix existing issues and build a Chess.com-style friends and matchmaking system for Palindrome.

---

## Phase 1: Critical Fixes (Do First)

### 1.1 Fix Rematch Logic
**Current issues:** Rematch request flow not working; subscription/realtime may not fire; edge cases.

**Planned fixes:**
- Debug `subscribeToRematchRequests`: ensure Realtime is enabled for `rematch_requests`, verify payload handling
- Add fallback polling (every 2–3s) if Realtime is unreliable
- Handle race: both click rematch nearly simultaneously (transaction/atomic check)
- Clear request state when navigating away
- Show "Waiting for opponent..." after requester clicks Rematch

### 1.2 Fix Concurrent Matchmaking
**Current issues:** Multiple players clicking "Find Match" at once get stuck on waiting screen; possible race conditions.

**Root cause:** 
- `findOrCreateQuickMatch` uses `.limit(1).maybeSingle()` — first player creates, others may race
- RLS or insert/update race when two players try to join the same match
- Missing ordering — we should pick the oldest waiting match deterministically

**Planned fixes:**
- Use `FOR UPDATE SKIP LOCKED` or equivalent to lock the first available waiting match atomically (via RPC)
- Or: create a Supabase Edge Function/RPC that atomically: find oldest waiting match → insert player → update status
- Ensure only one player can "claim" a waiting match; others create new matches
- Add retry logic for transient conflicts
- When match becomes `active`, waiting screen subscription must redirect — verify subscription fires

### 1.3 Fix Quick Match Waiting Redirect
- Ensure `matchwaiting` subscribes to match status
- When `status = 'active'` (opponent joined), navigate to `gamelayout` immediately
- Handle case where user creates match and is alone — stay on waiting until someone joins or 60s cancel

---

## Phase 2: Friends System – Database Schema

### 2.1 New Tables

```sql
-- Friends: bidirectional relationship (A adds B = both are friends)
friends (
  id uuid PK,
  user_id uuid FK auth.users,      -- who initiated
  friend_id uuid FK auth.users,    -- the friend
  status text,                     -- 'pending' | 'accepted'
  created_at timestamptz,
  UNIQUE(user_id, friend_id)
)

-- Friend requests (optional – if we want pending requests)
-- Or: friends with status 'pending' until accepted

-- Challenges: invite friend to a match (alternative to invite codes)
challenges (
  id uuid PK,
  from_user_id uuid FK,
  to_user_id uuid FK,
  match_id uuid FK matches,        -- created match (waiting)
  status text,                     -- 'pending' | 'accepted' | 'declined'
  created_at timestamptz
)
```

**Design choice:** Chess.com uses "Send friend request" → other accepts. We'll mirror that: `friends` with `status = 'pending' | 'accepted'`.

### 2.2 Extend Existing
- `matches`: add `challenge_id uuid` (optional) to link challenge-based matches
- Or keep matches generic; challenges just create matches and notify friend

---

## Phase 3: Friends System – Core Features

### 3.1 Add Friend (Send Request)
1. User A searches by username/email or picks from "Players you've met" (recent opponents)
2. A sends friend request → insert into `friends` with `status = 'pending'`
3. B sees notification: "A wants to be your friend" — Accept / Decline
4. On accept: update `status = 'accepted'`; both can now see each other in Friends list

### 3.2 Friends List
- Screen: "Friends" tab or section in Multiplayer
- List: avatar, name, online status (optional), "Challenge" button
- Each friend row: name, profile pic, win/loss vs you, "Challenge" button

### 3.3 Challenge Friend
- Click "Challenge" on a friend → create a private match (invite code or challenge record)
- Opponent gets in-app notification / push: "A is challenging you!"
- Accept → join match, go to game
- Decline → challenger sees "B declined"

### 3.4 Match History & Stats
- **Head-to-head:** For each friend, show matches played, your wins, their wins, draws (if any)
- **Overall stats:** Total matches, wins, losses (from `match_players` where `is_winner`)
- **Recent matches:** List of games with that friend (date, result, scores)

**Queries:**
- Wins vs friend: `match_players` where `user_id = me` and `is_winner = true`, join matches that include friend
- Use `match_players` to find matches where both me and friend participated

---

## Phase 4: UI/UX – Consistent Design

### 4.1 Design Tokens (Already have theme/colors)
- Reuse `ThemeContext` (dark/light), `colors.accent`, `colors.text`, etc.
- Card style: same `borderRadius`, padding, background (`cardBg`)
- Buttons: primary (gradient), secondary (outline)
- Typography: Geist-Bold for titles, Geist-Regular for body

### 4.2 New Screens & Consistency
| Screen        | Purpose                    | Shared components        |
|---------------|----------------------------|---------------------------|
| Friends       | List friends, add, challenge| Card, avatar, primary btn |
| Add Friend    | Search by username/email   | Search input, list        |
| Friend Profile| Stats vs friend, challenge | Score cards, buttons      |
| Notifications | Friend requests, challenges| Toast / modal             |

### 4.3 Navigation
- Multiplayer lobby: tabs or sections for "Quick Match", "Friends", "Challenges", "Recent"
- Or: Friends as separate tab in main tabs
- Keep `matchwaiting`, `matchresult`, `gamelayout` as-is; only extend data

---

## Phase 5: Implementation Order

### Step 1: Fix rematch (Phase 1.1)
### Step 2: Fix concurrent matchmaking (Phase 1.2, 1.3)
### Step 3: Friends DB schema + RLS (Phase 2)
### Step 4: Add friend / Accept request (Phase 3.1)
### Step 5: Friends list (Phase 3.2)
### Step 6: Challenge friend flow (Phase 3.3)
### Step 7: Match history & head-to-head stats (Phase 3.4)
### Step 8: Polish UI consistency (Phase 4)

---

## Phase 6: Technical Notes

### Realtime Subscriptions
- `matches`, `match_players` — already used
- `rematch_requests` — ensure in Realtime publication
- `friends` — for friend request notifications
- `challenges` — for challenge notifications

### RLS
- Friends: user can read/write own rows; friend can update when accepting
- Challenges: from/to users can read; to_user can update (accept/decline)

### Performance
- Index: `friends(user_id)`, `friends(friend_id)`, `match_players(user_id, match_id)`
- For head-to-head: materialized view or cached stats if needed later

---

## Summary

1. **Phase 1:** Fix rematch and concurrent matchmaking (critical)
2. **Phase 2:** Add friends schema
3. **Phase 3:** Implement add friend, friends list, challenge, stats
4. **Phase 4:** Keep UI consistent across all screens
5. **Phase 5:** Implement in the order above to avoid conflicts

Start with Phase 1, then Phase 2, then Phase 3 in order. UI polish (Phase 4) can be done incrementally with each feature.
