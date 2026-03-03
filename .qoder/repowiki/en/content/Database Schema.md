# Database Schema

<cite>
**Referenced Files in This Document**
- [20240127000000_init_profiles.sql](file://supabase/migrations/20240127000000_init_profiles.sql)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql)
- [20250205100000_fix_match_players_rls_recursion.sql](file://supabase/migrations/20250205100000_fix_match_players_rls_recursion.sql)
- [20250205200000_fix_matches_insert_rls.sql](file://supabase/migrations/20250205200000_fix_matches_insert_rls.sql)
- [20250205300000_allow_join_by_invite_code.sql](file://supabase/migrations/20250205300000_allow_join_by_invite_code.sql)
- [20250205400000_abandoned_match_cancel.sql](file://supabase/migrations/20250205400000_abandoned_match_cancel.sql)
- [20250205500000_rematch_requests.sql](file://supabase/migrations/20250205500000_rematch_requests.sql)
- [20250206000000_atomic_quick_match.sql](file://supabase/migrations/20250206000000_atomic_quick_match.sql)
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql)
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql)
- [supabase.ts](file://supabase.ts)
- [.env](file://.env)
- [notifications.ts](file://lib/notifications.ts)
- [friends.ts](file://lib/friends.ts)
- [matchmaking.ts](file://lib/matchmaking.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document provides comprehensive database schema documentation for the Palindrome Supabase implementation. It covers the complete table structure for profiles, matches, match_players, friends, challenges, rematch_requests, and notifications. It explains relationships, foreign keys, indexing strategies, row-level security (RLS) policies, migration management, schema evolution, data integrity constraints, Supabase configuration, authentication integration, real-time subscriptions, validation rules, and performance optimization. It also outlines common data access patterns and how they integrate with the application’s service layer.

## Project Structure
The database schema is managed via Supabase migrations under the migrations directory. The client-side Supabase configuration and authentication integration are centralized in a dedicated module. Application services consume the database through Supabase queries and real-time subscriptions.

```mermaid
graph TB
subgraph "Supabase Migrations"
P["profiles<br/>init_profiles.sql"]
M["matches<br/>multiplayer_tables.sql"]
MP["match_players<br/>multiplayer_tables.sql"]
F["friends<br/>friends_and_challenges.sql"]
C["challenges<br/>friends_and_challenges.sql"]
RR["rematch_requests<br/>rematch_requests.sql"]
N["notifications<br/>notifications.sql"]
end
subgraph "Application Services"
S["supabase.ts<br/>client config"]
U["users<br/>auth.users"]
end
U --> P
P --> MP
M --> MP
M --> C
C --> RR
U --> F
U --> N
S --> P
S --> M
S --> MP
S --> F
S --> C
S --> RR
S --> N
```

**Diagram sources**
- [20240127000000_init_profiles.sql](file://supabase/migrations/20240127000000_init_profiles.sql#L1-L61)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L1-L84)
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L1-L50)
- [20250205500000_rematch_requests.sql](file://supabase/migrations/20250205500000_rematch_requests.sql#L1-L37)
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L1-L28)
- [supabase.ts](file://supabase.ts#L1-L75)

**Section sources**
- [20240127000000_init_profiles.sql](file://supabase/migrations/20240127000000_init_profiles.sql#L1-L61)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L1-L84)
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L1-L50)
- [20250205500000_rematch_requests.sql](file://supabase/migrations/20250205500000_rematch_requests.sql#L1-L37)
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L1-L28)
- [supabase.ts](file://supabase.ts#L1-L75)

## Core Components
- Profiles: User metadata and avatar storage integration.
- Matches: Game sessions with lifecycle and timing controls.
- Match Players: Per-match participant records with scores and submission tracking.
- Friends: Bidirectional friendship requests with acceptance workflow.
- Challenges: Invite-based match invitations between users.
- Rematch Requests: Post-match request mechanism with acceptance/decline.
- Notifications: User-targeted alerts for friend requests, challenges, and app updates.

**Section sources**
- [20240127000000_init_profiles.sql](file://supabase/migrations/20240127000000_init_profiles.sql#L1-L61)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L1-L84)
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L1-L50)
- [20250205500000_rematch_requests.sql](file://supabase/migrations/20250205500000_rematch_requests.sql#L1-L37)
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L1-L28)

## Architecture Overview
The database enforces strict access control via RLS and exposes tables to the client through Supabase Auth and real-time. Application services encapsulate CRUD and real-time subscription logic, ensuring consistent data access patterns.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant SupaTS as "supabase.ts"
participant DB as "PostgreSQL"
participant RT as "Realtime"
Client->>SupaTS : "getSupabaseClient()"
SupaTS-->>Client : "SupabaseClient"
Client->>DB : "Auth + Queries"
DB-->>Client : "RLS-enforced Rows"
Client->>RT : "Subscribe to tables"
RT-->>Client : "Live updates"
```

**Diagram sources**
- [supabase.ts](file://supabase.ts#L42-L74)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L83-L84)
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L1-L28)

## Detailed Component Analysis

### Profiles
- Purpose: Store user public profile data linked to Supabase Auth users.
- Key constraints:
  - Primary key: user UUID referencing auth.users with cascade delete.
  - Username length check.
- RLS:
  - Selectable by everyone.
  - Insert/update restricted to the owning user.
- Storage:
  - Avatar bucket created and exposed via policies.
- Trigger:
  - Automatically inserts a profile row when a new user registers.

```mermaid
erDiagram
AUTH_USERS {
uuid id PK
}
PROFILES {
uuid id PK
text username
text full_name
text avatar_url
text website
text email
text phone
timestamptz updated_at
}
AUTH_USERS ||--|| PROFILES : "references"
```

**Diagram sources**
- [20240127000000_init_profiles.sql](file://supabase/migrations/20240127000000_init_profiles.sql#L2-L13)
- [20240127000000_init_profiles.sql](file://supabase/migrations/20240127000000_init_profiles.sql#L28-L46)

**Section sources**
- [20240127000000_init_profiles.sql](file://supabase/migrations/20240127000000_init_profiles.sql#L1-L61)

### Matches
- Purpose: Represent asynchronous race-style game sessions.
- Lifecycle:
  - Statuses: waiting, active, finished, cancelled.
  - Modes: race (single mode defined).
  - Timing: time_limit_seconds, optional invite_code for private matches.
- Integrity:
  - Unique invite_code.
  - Created_by tracks initial creator for access control.
- RLS:
  - Select: participants, creator, or any authenticated user when status = waiting.
  - Insert: authenticated users.
  - Update: participants or creator.
- Background maintenance:
  - pg_cron scheduled job cancels abandoned matches after 60 seconds if less than two players.

```mermaid
erDiagram
MATCHES {
uuid id PK
timestamptz created_at
text status
text mode
text seed
text invite_code
int time_limit_seconds
timestamptz started_at
timestamptz finished_at
uuid created_by
}
MATCH_PLAYERS {
uuid id PK
uuid match_id FK
uuid user_id FK
int score
timestamptz submitted_at
bool is_winner
}
CHALLENGES {
uuid id PK
uuid from_user_id FK
uuid to_user_id FK
uuid match_id FK
}
REMATCH_REQUESTS {
uuid id PK
uuid match_id FK
uuid from_user_id FK
uuid to_user_id FK
text status
uuid created_match_id
}
MATCHES ||--o{ MATCH_PLAYERS : "hosts"
MATCHES ||--o{ CHALLENGES : "creates"
MATCHES ||--o{ REMATCH_REQUESTS : "targets"
```

**Diagram sources**
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L3-L13)
- [20250205200000_fix_matches_insert_rls.sql](file://supabase/migrations/20250205200000_fix_matches_insert_rls.sql#L4-L19)
- [20250205400000_abandoned_match_cancel.sql](file://supabase/migrations/20250205400000_abandoned_match_cancel.sql#L5-L10)
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L28-L35)
- [20250205500000_rematch_requests.sql](file://supabase/migrations/20250205500000_rematch_requests.sql#L4-L12)

**Section sources**
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L1-L84)
- [20250205200000_fix_matches_insert_rls.sql](file://supabase/migrations/20250205200000_fix_matches_insert_rls.sql#L1-L29)
- [20250205300000_allow_join_by_invite_code.sql](file://supabase/migrations/20250205300000_allow_join_by_invite_code.sql#L1-L14)
- [20250205400000_abandoned_match_cancel.sql](file://supabase/migrations/20250205400000_abandoned_match_cancel.sql#L1-L31)

### Match Players
- Purpose: Track per-user participation in matches, scores, and submission state.
- Constraints:
  - Unique composite key on (match_id, user_id).
  - Foreign keys to matches and auth.users with cascade delete.
- RLS:
  - Select: users participating in the same match.
  - Insert: user can add themselves.
  - Update/Delete: user can only modify/delete their own row.

```mermaid
flowchart TD
Start(["Join Match"]) --> Check["Check match exists and status = waiting"]
Check --> Join["Insert match_players row for user"]
Join --> UpdateStatus["Update matches status = active and started_at"]
UpdateStatus --> Notify["Realtime notifies both players"]
Notify --> End(["Active Game"])
```

**Diagram sources**
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L15-L23)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L68-L81)

**Section sources**
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L1-L84)

### Friends
- Purpose: Manage friend requests and accepted friendships.
- Constraints:
  - Unique constraint on (user_id, friend_id).
  - Self-friendship prohibited via check constraint.
- RLS:
  - Select: either party of the friendship.
  - Insert: requesting user.
  - Update: recipient can accept.

```mermaid
erDiagram
FRIENDS {
uuid id PK
uuid user_id FK
uuid friend_id FK
text status
timestamptz created_at
}
AUTH_USERS ||--o{ FRIENDS : "user"
AUTH_USERS ||--o{ FRIENDS : "friend"
```

**Diagram sources**
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L3-L11)

**Section sources**
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L1-L50)

### Challenges
- Purpose: Invite a friend to a match; links to a created match record.
- Constraints:
  - From/to users must be distinct.
  - References to auth.users and matches.
- RLS:
  - Select: either party.
  - Insert: initiating user.
  - Update: recipient can accept/decline.

```mermaid
sequenceDiagram
participant A as "User A"
participant B as "User B"
participant DB as "matches + challenges"
A->>DB : "Create match (status=waiting)"
DB-->>A : "match_id"
A->>DB : "Insert challenge (from=A, to=B, match_id)"
DB-->>A : "challenge row"
note over B,DB : "B receives notification and can accept"
B->>DB : "Update challenge status = accepted"
DB-->>B : "challenge accepted"
```

**Diagram sources**
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L28-L35)

**Section sources**
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L1-L50)

### Rematch Requests
- Purpose: Allow post-match requests for a new game with the same opponent.
- Constraints:
  - Composite foreign keys to matches and auth.users.
  - Optional linkage to a newly created match.
- RLS:
  - Select: involved users.
  - Insert: initiating user.
  - Update: recipient can accept/decline.

```mermaid
flowchart TD
Start(["After Match"]) --> Initiate["User A sends rematch request"]
Initiate --> Pending["Status = pending"]
Pending --> Accept{"User B accepts?"}
Accept --> |Yes| CreateNew["Create new match (optional)"]
Accept --> |No| Decline["Status = declined"]
CreateNew --> Active["New match active"]
Decline --> End(["End"])
Active --> End
```

**Diagram sources**
- [20250205500000_rematch_requests.sql](file://supabase/migrations/20250205500000_rematch_requests.sql#L4-L12)
- [20250205500000_rematch_requests.sql](file://supabase/migrations/20250205500000_rematch_requests.sql#L19-L34)

**Section sources**
- [20250205500000_rematch_requests.sql](file://supabase/migrations/20250205500000_rematch_requests.sql#L1-L37)

### Notifications
- Purpose: Deliver user-specific notifications for friend requests, challenges, and app updates.
- Constraints:
  - Type constrained to a fixed set.
  - JSONB data payload with defaults.
- RLS:
  - Select/update: user_id equals authenticated user.
  - Insert: authenticated users.

```mermaid
erDiagram
NOTIFICATIONS {
uuid id PK
uuid user_id FK
text type
text title
text body
jsonb data
timestamptz read_at
timestamptz created_at
}
AUTH_USERS ||--o{ NOTIFICATIONS : "recipient"
```

**Diagram sources**
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L3-L12)

**Section sources**
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L1-L28)

## Dependency Analysis
- Authentication dependency: All tables reference auth.users except storage.objects for avatars.
- RLS dependency chain: Policies depend on auth.uid() and helper functions to prevent recursion.
- Realtime dependency: Supabase Realtime publishes selected tables; clients subscribe to channels.
- Migration dependency: Later migrations refine earlier policies and add features (e.g., created_by, pg_cron, rematch_requests).

```mermaid
graph LR
AUTH["auth.users"] --> PROFILES["profiles"]
AUTH --> MATCH_PLAYERS["match_players"]
AUTH --> FRIENDS["friends"]
AUTH --> CHALLENGES["challenges"]
AUTH --> REMATCH["rematch_requests"]
AUTH --> NOTIFICATIONS["notifications"]
MATCHES["matches"] --> MATCH_PLAYERS
MATCHES --> CHALLENGES
MATCHES --> REMATCH
```

**Diagram sources**
- [20240127000000_init_profiles.sql](file://supabase/migrations/20240127000000_init_profiles.sql#L3-L3)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L17-L18)
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L5-L6)
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L5-L5)

**Section sources**
- [20240127000000_init_profiles.sql](file://supabase/migrations/20240127000000_init_profiles.sql#L1-L61)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L1-L84)
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L1-L50)
- [20250205500000_rematch_requests.sql](file://supabase/migrations/20250205500000_rematch_requests.sql#L1-L37)
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L1-L28)

## Performance Considerations
- Indexing strategies:
  - match_players: match_id, user_id (for participant queries and joins).
  - matches: status with invite_code null for quick-match lookups; invite_code not null for invite-based lookups.
  - friends: user_id, friend_id, status=pending for efficient request retrieval.
  - challenges: to_user_id, match_id for recipient and match-centric queries.
  - notifications: user_id, user_id with read_at=null, created_at descending for unread counts and timelines.
- Concurrency control:
  - Atomic quick match RPC serializes joining/waiting match selection and insertion.
- Background jobs:
  - pg_cron cancels abandoned matches to free resources.
- Query patterns:
  - Prefer selective filters with indexed columns.
  - Use LIMIT and ORDER BY created_at for paginated feeds.
  - Leverage real-time subscriptions to minimize polling.

**Section sources**
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L25-L28)
- [20250206100000_friends_and_challenges.sql](file://supabase/migrations/20250206100000_friends_and_challenges.sql#L13-L15)
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L14-L16)
- [20250206000000_atomic_quick_match.sql](file://supabase/migrations/20250206000000_atomic_quick_match.sql#L3-L44)
- [20250205400000_abandoned_match_cancel.sql](file://supabase/migrations/20250205400000_abandoned_match_cancel.sql#L18-L30)

## Troubleshooting Guide
- RLS recursion fix:
  - A SECURITY DEFINER helper function checks participation to avoid recursive policy evaluation.
- Insert-read consistency:
  - created_by column allows the creator to read a match immediately after insertion.
- Public read for waiting matches:
  - Any authenticated user can read waiting matches to support invite and quick-match flows.
- Abandoned match cleanup:
  - Scheduled pg_cron job updates stale matches to cancelled; verify job scheduling if not triggered.
- Realtime availability:
  - Ensure tables are included in the Supabase Realtime publication for live updates.

**Section sources**
- [20250205100000_fix_match_players_rls_recursion.sql](file://supabase/migrations/20250205100000_fix_match_players_rls_recursion.sql#L4-L35)
- [20250205200000_fix_matches_insert_rls.sql](file://supabase/migrations/20250205200000_fix_matches_insert_rls.sql#L4-L28)
- [20250205300000_allow_join_by_invite_code.sql](file://supabase/migrations/20250205300000_allow_join_by_invite_code.sql#L6-L13)
- [20250205400000_abandoned_match_cancel.sql](file://supabase/migrations/20250205400000_abandoned_match_cancel.sql#L18-L30)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L83-L84)

## Conclusion
The Palindrome database schema is designed around clear entity boundaries, robust RLS for data isolation, and pragmatic indexing to support real-time multiplayer flows. Migrations document a deliberate evolution toward atomic matchmaking, friend/challenge systems, and notification infrastructure. The Supabase client configuration and service-layer integrations provide a cohesive pattern for authentication, querying, and real-time updates.

## Appendices

### Supabase Configuration and Authentication Integration
- Client initialization:
  - Environment variables supply Supabase URL and anonymous/anon key.
  - Session persistence and token refresh are configured.
- Environment variables:
  - Supabase URL and keys are provided via environment configuration.

```mermaid
sequenceDiagram
participant App as "App"
participant Env as ".env/eas.json"
participant SupaTS as "supabase.ts"
participant Supabase as "Supabase"
App->>Env : "Load EXPO_PUBLIC_SUPABASE_*"
App->>SupaTS : "getSupabaseClient()"
SupaTS->>Supabase : "createClient(url, anonKey, authOptions)"
Supabase-->>App : "SupabaseClient instance"
```

**Diagram sources**
- [.env](file://.env#L8-L12)
- [supabase.ts](file://supabase.ts#L42-L74)

**Section sources**
- [supabase.ts](file://supabase.ts#L1-L75)
- [.env](file://.env#L1-L14)

### Real-Time Subscription Setup
- Matches and match_players:
  - Subscribed via postgres_changes for status and score updates.
- Notifications:
  - Subscribed for user-specific updates.
- Rematch requests:
  - Should be included in Realtime publication for live acceptance/decline.

```mermaid
sequenceDiagram
participant UI as "UI Component"
participant SVC as "matchmaking.ts"
participant RT as "Supabase Realtime"
participant DB as "PostgreSQL"
UI->>SVC : "subscribeToMatch(matchId, callback)"
SVC->>RT : "channel('match : ...').on(postgres_changes)"
DB-->>RT : "Row changes"
RT-->>SVC : "Event"
SVC-->>UI : "callback(updated match)"
```

**Diagram sources**
- [matchmaking.ts](file://lib/matchmaking.ts#L204-L247)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L83-L84)
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L1-L28)

**Section sources**
- [matchmaking.ts](file://lib/matchmaking.ts#L204-L247)
- [20250205000000_multiplayer_tables.sql](file://supabase/migrations/20250205000000_multiplayer_tables.sql#L83-L84)
- [20250206110000_notifications.sql](file://supabase/migrations/20250206110000_notifications.sql#L1-L28)

### Data Access Patterns and Service Layer Integration
- Notifications:
  - Fetch user notifications, unread counts, mark as read, and create notifications.
- Friends:
  - Retrieve pending requests, accepted friends, and decline requests.
- Matchmaking:
  - Atomic quick match claim, subscribe to match updates, update live scores, and submit final scores.

```mermaid
flowchart TD
A["Get Notifications"] --> B["Filter by user_id, order by created_at desc"]
C["Get Unread Count"] --> D["Count where read_at is null"]
E["Mark As Read"] --> F["Update read_at for user's notification"]
G["Atomic Quick Match"] --> H["claim_quick_match RPC"]
I["Subscribe to Match"] --> J["Realtime channels for matches + match_players"]
K["Update Live Score"] --> L["Update match_players.score where submitted_at is null"]
```

**Diagram sources**
- [notifications.ts](file://lib/notifications.ts#L24-L57)
- [friends.ts](file://lib/friends.ts#L86-L129)
- [20250206000000_atomic_quick_match.sql](file://supabase/migrations/20250206000000_atomic_quick_match.sql#L3-L44)
- [matchmaking.ts](file://lib/matchmaking.ts#L204-L276)

**Section sources**
- [notifications.ts](file://lib/notifications.ts#L1-L110)
- [friends.ts](file://lib/friends.ts#L86-L129)
- [matchmaking.ts](file://lib/matchmaking.ts#L158-L276)