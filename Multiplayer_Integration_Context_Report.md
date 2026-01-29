# Multiplayer Integration Context Report (Internal / Technical)

## Purpose
This report captures the current project scan findings and a comprehensive technical view of how multiplayer can be integrated into the existing Palindrome® app.

This file is intended for internal planning and implementation reference.

---

## Repository Overview
- Project type: Expo + React Native + Expo Router (native + web)
- Main app entry: `expo-router/entry`
- Scripts: `expo start`, `expo start --web`, `expo lint`
  - Reference: [package.json](file:///d:/StratonAlly/Code/palindromefinal/package.json)

---

## Routing & Screens (High-Level)
- Routing is file-based under `app/`
- Tabs group: `app/(tabs)/`
- Main menu:
  - Native: [main.tsx](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/main.tsx)
  - Web: [main.web.tsx](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/main.web.tsx)
- Gameplay screen:
  - Native: [gamelayout.tsx](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.tsx)
  - Web: [gamelayout.web.tsx](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.web.tsx)
- Main menu already includes a “Multiplayer” tile marked “Soon”:
  - Native tile: [main.tsx:L571-L668](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/main.tsx#L571-L668)
  - Web tile list: [main.web.tsx](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/main.web.tsx)

---

## Authentication & Profile Layer
- Supabase client is initialized from Expo public env vars:
  - [supabase.ts](file:///d:/StratonAlly/Code/palindromefinal/supabase.ts)
- Auth flows support:
  - Web OAuth redirect flow
  - Native Google Sign-In
  - Apple Sign-In
  - Reference: [authService.ts](file:///d:/StratonAlly/Code/palindromefinal/authService.ts)
- User profile table exists (`profiles`) with RLS policies and a trigger to create a profile on auth user creation:
  - Migration: [20240127000000_init_profiles.sql](file:///d:/StratonAlly/Code/palindromefinal/supabase/migrations/20240127000000_init_profiles.sql)
- Current schema does not include match, session, moves, leaderboard, or game history tables.

---

## Current Gameplay Model (Single Player)

### Core State
- Board is an 11×11 grid:
  - `gridState: (number | null)[][]`
- Available pieces:
  - 5 color indices
  - inventory per color: `blockCounts` defaults to `[16,16,16,16,16]`
  - Native: [gamelayout.tsx:L656-L668](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.tsx#L656-L668)
  - Web mirrors this logic in [gamelayout.web.tsx](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.web.tsx)
- Score, hints, timer:
  - Native state is in [gamelayout.tsx:L471-L487](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.tsx#L471-L487)

### Special Tiles / Board Setup
- The “PALINDROME” word is displayed across the center cross (UI overlay letters).
- Bulldogs are random bonus tiles; palindromes crossing bulldog positions get a bonus.
- Bulldog spawn + initial pre-placed colors (native):
  - [gamelayout.tsx:L704-L751](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.tsx#L704-L751)

### Scoring & Palindrome Detection
- After a block is dropped, the game checks row and column segments around that location.
- If the contiguous non-empty segment length meets threshold (default `minLength=3`) and the color sequence reads the same forward/backward, score is awarded.
- Bulldog bonus adds +10 to the segment score if any bulldog tile is within the palindrome segment.
- Native: [gamelayout.tsx:L802-L867](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.tsx#L802-L867)

### Hint System
- Hint attempts simulate a placement to find a scoring move.
- It decrements hints when it finds a scoring move and highlights that cell temporarily.
- Native: [gamelayout.tsx:L869-L900](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.tsx#L869-L900)

### Move Application
- A valid drop:
  - ensures cell empty
  - ensures inventory > 0 for selected color
  - writes to grid, decrements inventory, computes score delta
- Native: [handleDrop](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.tsx#L902-L940)

---

## Multiplayer Concepts (Technical Options)

### Option A: Async “Race” (Lowest Implementation Risk)
- Players play separate boards generated from the same seed (same bulldogs + initial placements).
- Winner by:
  - highest score at time limit, or
  - first to target score
- Benefits:
  - minimal contention issues (no shared board)
  - can be shipped earlier while proving matchmaking and results pipelines

### Option B: Turn-Based Shared Board Duel (Recommended “Competitive Core”)
- Two players take turns placing blocks on a shared board.
- Each move triggers scoring checks (row+col around drop).
- Requires authoritative turn order, conflict prevention, and a move log.

### Option C: Real-Time Shared Board (Highest Complexity)
- Both players place simultaneously on one board.
- Requires arbitration for cell collisions and latency reconciliation.

---

## Recommended Delivery Plan (Engineering)

### Phase 1: Async Race MVP
- Add match creation + invite codes
- Seeded board generation
- Match status (waiting/active/finished)
- Result submission and result view
- Optional presence updates (online, match started)

### Phase 2: Turn-Based Shared Board
- Server-authoritative move submission
- Turn timer and turn switching
- Reconnect support
- Match history

### Phase 3: Real-Time Shared Board and Co-op
- Collision handling strategies
- Live sync improvements
- Ranked ladders / seasonal features (optional)

---

## Integration Points & Required Refactors

### Key Integration Points in Current Code
- Gameplay state and rules are currently embedded in two large UI files:
  - Native: [gamelayout.tsx](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.tsx)
  - Web: [gamelayout.web.tsx](file:///d:/StratonAlly/Code/palindromefinal/app/(tabs)/gamelayout.web.tsx)
- Multiplayer will need a canonical “game engine” layer to avoid divergence across platforms:
  - board initialization
  - move validation
  - scoring logic (palindrome detection)
  - serialization/deserialization of match state

### Suggested Shared Data Model (Conceptual)
- `matchId`
- `mode` (race / turn-based / realtime)
- `seed` (ensures deterministic setup)
- `board` (11×11 cell array)
- `bulldogs` (positions)
- `players` (user ids and display snapshots)
- `scores` (per player)
- `inventories` (per player per color)
- `turn` (turn-based only)
- `status` (waiting/active/finished)

---

## Backend Additions Needed (Supabase)

### Tables (High-Level)
- `matches` (one row per match)
- `match_players` (participants)
- `match_moves` (append-only move log)
- `leaderboards` or views (optional)

### Access Rules (High-Level)
- Only participants can read/write their matches
- Only the active player can submit a move in turn-based mode
- Move submission should be validated and scored server-side for anti-cheat

---

## Client UX Additions Needed
- Multiplayer lobby screen:
  - Quick Match
  - Invite Friend (code/link)
  - Join via code
  - Recent matches
- Match screen:
  - Opponent panel
  - Turn indicator or countdown (turn-based)
  - Connection/reconnect states
- End-of-match:
  - Winner + score breakdown
  - Rematch

---

## Key Risks (Technical) & Mitigations
- Logic drift across web/native duplicated code
  - Mitigation: shared game logic module used by both platforms
- Cheating by client-side score reporting
  - Mitigation: server-authoritative scoring and move validation
- Reconnect and out-of-order events
  - Mitigation: append-only move log + periodic state reconciliation

