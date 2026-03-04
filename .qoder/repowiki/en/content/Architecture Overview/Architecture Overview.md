# Architecture Overview

<cite>
**Referenced Files in This Document**
- [package.json](file://package.json)
- [README.md](file://README.md)
- [app/_layout.tsx](file://app/_layout.tsx)
- [supabase.ts](file://supabase.ts)
- [authService.ts](file://authService.ts)
- [hooks/useAuth.ts](file://hooks/useAuth.ts)
- [context/ThemeContext.tsx](file://context/ThemeContext.tsx)
- [constants/theme.ts](file://constants/theme.ts)
- [hooks/use-theme-color.ts](file://hooks/use-theme-color.ts)
- [context/SettingsContext.tsx](file://context/SettingsContext.tsx)
- [lib/gameEngine.ts](file://lib/gameEngine.ts)
- [lib/matchmaking.ts](file://lib/matchmaking.ts)
- [lib/gameColors.ts](file://lib/gameColors.ts)
- [app/(tabs)/main.tsx](file://app/(tabs)/main.tsx)
- [app/(tabs)/multiplayer.tsx](file://app/(tabs)/multiplayer.tsx)
- [app/(tabs)/gamelayout.tsx](file://app/(tabs)/gamelayout.tsx)
- [components/themed-text.tsx](file://components/themed-text.tsx)
- [components/themed-view.tsx](file://components/themed-view.tsx)
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

## Introduction
This document describes the Palindrome game system architecture. It covers the cross-platform React Native application built with Expo Router, the Supabase backend integration for authentication and real-time multiplayer, and the separation of concerns across UI, business logic, and data layers. It also documents the provider pattern for state management, theme system, authentication flow, real-time communication, and scalability/performance considerations.

## Project Structure
The project follows a file-based routing structure with feature-based organization:
- app: UI routes and layouts using Expo Router
- context: Provider-based global state (theme, settings)
- hooks: reusable React hooks (auth, theme color, sounds)
- lib: shared business logic (game engine, matchmaking)
- components: themed UI primitives
- constants: theme definitions
- supabase.ts: centralized Supabase client initialization
- authService.ts: authentication service abstraction
- screens: platform-specific splash screens
- assets/public: static assets and fonts

```mermaid
graph TB
subgraph "UI Layer"
L["app/_layout.tsx"]
T1["app/(tabs)/main.tsx"]
T2["app/(tabs)/multiplayer.tsx"]
T3["app/(tabs)/gamelayout.tsx"]
C1["components/themed-text.tsx"]
C2["components/themed-view.tsx"]
end
subgraph "State Management"
P1["context/ThemeContext.tsx"]
P2["context/SettingsContext.tsx"]
H1["hooks/useAuth.ts"]
end
subgraph "Business Logic"
G1["lib/gameEngine.ts"]
M1["lib/matchmaking.ts"]
GC["lib/gameColors.ts"]
end
subgraph "Backend Integration"
S1["supabase.ts"]
A1["authService.ts"]
end
L --> P1
L --> P2
L --> H1
T1 --> P1
T2 --> P1
T3 --> P1
T3 --> P2
T3 --> G1
T3 --> M1
T3 --> GC
T2 --> M1
H1 --> A1
A1 --> S1
M1 --> S1
```

**Diagram sources**
- [app/_layout.tsx](file://app/_layout.tsx#L1-L126)
- [context/ThemeContext.tsx](file://context/ThemeContext.tsx#L1-L124)
- [context/SettingsContext.tsx](file://context/SettingsContext.tsx#L1-L187)
- [hooks/useAuth.ts](file://hooks/useAuth.ts#L1-L51)
- [lib/gameEngine.ts](file://lib/gameEngine.ts#L1-L284)
- [lib/matchmaking.ts](file://lib/matchmaking.ts#L1-L542)
- [lib/gameColors.ts](file://lib/gameColors.ts#L1-L93)
- [supabase.ts](file://supabase.ts#L1-L75)
- [authService.ts](file://authService.ts#L1-L560)
- [app/(tabs)/main.tsx](file://app/(tabs)/main.tsx#L1-L800)
- [app/(tabs)/multiplayer.tsx](file://app/(tabs)/multiplayer.tsx#L1-L342)
- [app/(tabs)/gamelayout.tsx](file://app/(tabs)/gamelayout.tsx#L1-L800)
- [components/themed-text.tsx](file://components/themed-text.tsx#L1-L61)
- [components/themed-view.tsx](file://components/themed-view.tsx#L1-L15)

**Section sources**
- [package.json](file://package.json#L1-L68)
- [README.md](file://README.md#L1-L59)
- [app/_layout.tsx](file://app/_layout.tsx#L1-L126)

## Core Components
- Authentication and session management via Supabase with a dedicated service wrapper
- Provider pattern for theme and settings state
- Shared game engine and deterministic state machine for single-player and multiplayer
- Matchmaking service for quick match, invite codes, and real-time updates
- Themed UI primitives and color utilities for consistent cross-platform styling

**Section sources**
- [authService.ts](file://authService.ts#L1-L560)
- [hooks/useAuth.ts](file://hooks/useAuth.ts#L1-L51)
- [context/ThemeContext.tsx](file://context/ThemeContext.tsx#L1-L124)
- [context/SettingsContext.tsx](file://context/SettingsContext.tsx#L1-L187)
- [lib/gameEngine.ts](file://lib/gameEngine.ts#L1-L284)
- [lib/matchmaking.ts](file://lib/matchmaking.ts#L1-L542)
- [components/themed-text.tsx](file://components/themed-text.tsx#L1-L61)
- [components/themed-view.tsx](file://components/themed-view.tsx#L1-L15)

## Architecture Overview
The system is layered:
- Presentation: Expo Router routes and themed UI components
- State: Providers for theme and settings
- Business Logic: Game engine and matchmaking
- Data Access: Supabase client with persisted auth sessions
- Real-time: Supabase Realtime channels for multiplayer updates

```mermaid
graph TB
subgraph "Presentation"
R["Expo Router<br/>app/_layout.tsx"]
UI1["Main Screen<br/>app/(tabs)/main.tsx"]
UI2["Multiplayer Lobby<br/>app/(tabs)/multiplayer.tsx"]
UI3["Game Layout<br/>app/(tabs)/gamelayout.tsx"]
end
subgraph "State"
TP["ThemeProvider<br/>context/ThemeContext.tsx"]
SP["SettingsProvider<br/>context/SettingsContext.tsx"]
UA["useAuth Hook<br/>hooks/useAuth.ts"]
end
subgraph "Business Logic"
GE["Game Engine<br/>lib/gameEngine.ts"]
MM["Matchmaking<br/>lib/matchmaking.ts"]
GC["Game Colors<br/>lib/gameColors.ts"]
end
subgraph "Data & Realtime"
SC["Supabase Client<br/>supabase.ts"]
AS["AuthService<br/>authService.ts"]
end
R --> TP
R --> SP
R --> UA
UI1 --> TP
UI2 --> TP
UI3 --> TP
UI3 --> SP
UI3 --> GE
UI3 --> MM
UI3 --> GC
UI2 --> MM
UA --> AS
AS --> SC
MM --> SC
```

**Diagram sources**
- [app/_layout.tsx](file://app/_layout.tsx#L1-L126)
- [context/ThemeContext.tsx](file://context/ThemeContext.tsx#L1-L124)
- [context/SettingsContext.tsx](file://context/SettingsContext.tsx#L1-L187)
- [hooks/useAuth.ts](file://hooks/useAuth.ts#L1-L51)
- [lib/gameEngine.ts](file://lib/gameEngine.ts#L1-L284)
- [lib/matchmaking.ts](file://lib/matchmaking.ts#L1-L542)
- [lib/gameColors.ts](file://lib/gameColors.ts#L1-L93)
- [supabase.ts](file://supabase.ts#L1-L75)
- [authService.ts](file://authService.ts#L1-L560)
- [app/(tabs)/main.tsx](file://app/(tabs)/main.tsx#L1-L800)
- [app/(tabs)/multiplayer.tsx](file://app/(tabs)/multiplayer.tsx#L1-L342)
- [app/(tabs)/gamelayout.tsx](file://app/(tabs)/gamelayout.tsx#L1-L800)

## Detailed Component Analysis

### Authentication and Session Management
- Centralized Supabase client with platform-aware storage and persisted sessions
- AuthService encapsulates OAuth flows (Google, Apple), password, magic links, and profile management
- useAuth hook subscribes to auth state changes and exposes user/loading state
- Route guards redirect unauthenticated users away from protected routes

```mermaid
sequenceDiagram
participant App as "App"
participant Router as "Root Layout"
participant AuthHook as "useAuth"
participant AuthSvc as "AuthService"
participant Supabase as "Supabase Client"
App->>Router : Initialize app
Router->>AuthHook : useAuth()
AuthHook->>Supabase : getSession()
Supabase-->>AuthHook : Current session
AuthHook->>AuthSvc : ensureProfile(user)
AuthSvc->>Supabase : Upsert profile
Supabase-->>AuthSvc : Profile
AuthSvc-->>AuthHook : Done
AuthHook-->>Router : user, loading=false
Router->>Router : Redirect based on auth state
```

**Diagram sources**
- [app/_layout.tsx](file://app/_layout.tsx#L56-L87)
- [hooks/useAuth.ts](file://hooks/useAuth.ts#L1-L51)
- [authService.ts](file://authService.ts#L360-L382)
- [authService.ts](file://authService.ts#L428-L468)
- [supabase.ts](file://supabase.ts#L42-L74)

**Section sources**
- [supabase.ts](file://supabase.ts#L1-L75)
- [authService.ts](file://authService.ts#L1-L560)
- [hooks/useAuth.ts](file://hooks/useAuth.ts#L1-L51)
- [app/_layout.tsx](file://app/_layout.tsx#L56-L87)

### Theme System and Cross-Platform Styling
- ThemeContext provides theme state and toggles with persistent storage
- useThemeColor resolves themed colors from props or defaults
- constants/theme defines platform-specific fonts and base colors
- ThemedText and ThemedView consume theme context for consistent styling
- Linear gradients and platform splash screens support visual polish

```mermaid
flowchart TD
Start(["App Start"]) --> LoadTheme["Load saved theme from storage"]
LoadTheme --> Provider["ThemeProvider"]
Provider --> Hooks["useTheme/useThemeColor"]
Hooks --> Resolve["Resolve light/dark color"]
Resolve --> Components["ThemedText/ThemedView"]
Components --> Render["Render with gradient backgrounds"]
Render --> End(["UI Ready"])
```

**Diagram sources**
- [context/ThemeContext.tsx](file://context/ThemeContext.tsx#L74-L108)
- [hooks/use-theme-color.ts](file://hooks/use-theme-color.ts#L1-L32)
- [constants/theme.ts](file://constants/theme.ts#L1-L54)
- [components/themed-text.tsx](file://components/themed-text.tsx#L1-L61)
- [components/themed-view.tsx](file://components/themed-view.tsx#L1-L15)
- [app/_layout.tsx](file://app/_layout.tsx#L36-L54)

**Section sources**
- [context/ThemeContext.tsx](file://context/ThemeContext.tsx#L1-L124)
- [hooks/use-theme-color.ts](file://hooks/use-theme-color.ts#L1-L32)
- [constants/theme.ts](file://constants/theme.ts#L1-L54)
- [components/themed-text.tsx](file://components/themed-text.tsx#L1-L61)
- [components/themed-view.tsx](file://components/themed-view.tsx#L1-L15)
- [app/_layout.tsx](file://app/_layout.tsx#L36-L54)

### Settings and Accessibility
- SettingsProvider persists user preferences (sound, haptics, color-blind mode, interaction mode, custom colors)
- Defaults and validation ensure robustness across sessions
- Custom game block gradients are derived from HSL utilities

```mermaid
flowchart TD
Init(["App Start"]) --> LoadPrefs["Load preferences from storage"]
LoadPrefs --> Provider["SettingsProvider"]
Provider --> Expose["Expose setters/getters"]
Expose --> UI["Game UI consumes settings"]
UI --> Effects["Apply color-blind mode, interaction mode, sounds"]
Effects --> Persist["Persist changes to storage"]
```

**Diagram sources**
- [context/SettingsContext.tsx](file://context/SettingsContext.tsx#L49-L177)
- [lib/gameColors.ts](file://lib/gameColors.ts#L1-L93)
- [app/(tabs)/gamelayout.tsx](file://app/(tabs)/gamelayout.tsx#L465-L602)

**Section sources**
- [context/SettingsContext.tsx](file://context/SettingsContext.tsx#L1-L187)
- [lib/gameColors.ts](file://lib/gameColors.ts#L1-L93)
- [app/(tabs)/gamelayout.tsx](file://app/(tabs)/gamelayout.tsx#L465-L602)

### Game Engine and Deterministic State
- Immutable state machine for grid, block counts, score, and bulldog positions
- Move validation, palindrome detection, and scoring logic are pure functions
- Seeded RNG ensures identical initial states across platforms for multiplayer fairness

```mermaid
flowchart TD
Start(["applyMove(state,row,col,color)"]) --> Validate["Validate bounds & color stock"]
Validate --> |Invalid| Fail["Return success=false"]
Validate --> |Valid| Place["Place color on grid"]
Place --> Check["checkPalindromes(newGrid,row,col,bulldogPositions)"]
Check --> Score["Compute score (+bonus if bulldog)"]
Score --> Update["Update blockCounts, score, moveCount"]
Update --> Return["Return newState & scoreDelta"]
```

**Diagram sources**
- [lib/gameEngine.ts](file://lib/gameEngine.ts#L167-L219)
- [lib/gameEngine.ts](file://lib/gameEngine.ts#L106-L161)

**Section sources**
- [lib/gameEngine.ts](file://lib/gameEngine.ts#L1-L284)

### Matchmaking and Real-Time Multiplayer
- Quick match via atomic database RPC; invite-based matches with unique codes
- Realtime subscriptions to matches and match_players tables; fallback polling for reliability
- Live score updates and final score submission with winner determination
- Rematch requests and creation of new matches

```mermaid
sequenceDiagram
participant Player as "Player"
participant UI as "Multiplayer UI"
participant MM as "Matchmaking Service"
participant DB as "Supabase DB"
participant RT as "Realtime Channel"
Player->>UI : Click "Find Match"
UI->>MM : findOrCreateQuickMatch(userId)
MM->>DB : RPC claim_quick_match(userId)
DB-->>MM : Match(id, seed)
MM-->>UI : Match
UI->>RT : subscribeToMatch(matchId)
RT-->>UI : Live updates (status, scores)
Player->>UI : Submit final score
UI->>MM : submitScore(matchId, userId, score)
MM->>DB : Update match_players + finish matches if both submitted
DB-->>RT : Changes broadcast
RT-->>UI : Updated match state
```

**Diagram sources**
- [lib/matchmaking.ts](file://lib/matchmaking.ts#L58-L66)
- [lib/matchmaking.ts](file://lib/matchmaking.ts#L204-L247)
- [lib/matchmaking.ts](file://lib/matchmaking.ts#L271-L327)
- [app/(tabs)/multiplayer.tsx](file://app/(tabs)/multiplayer.tsx#L74-L92)
- [app/(tabs)/gamelayout.tsx](file://app/(tabs)/gamelayout.tsx#L760-L779)

**Section sources**
- [lib/matchmaking.ts](file://lib/matchmaking.ts#L1-L542)
- [app/(tabs)/multiplayer.tsx](file://app/(tabs)/multiplayer.tsx#L1-L342)
- [app/(tabs)/gamelayout.tsx](file://app/(tabs)/gamelayout.tsx#L734-L779)

### Navigation and Routing
- Expo Router file-based routing with nested groups and shared layout
- Root layout applies theme gradients, font loading, splash screen, and auth redirects
- Tab screens for main menu, multiplayer lobby, and game layout

```mermaid
graph LR
Root["_layout.tsx"] --> Tabs["(tabs) group"]
Tabs --> Main["main.tsx"]
Tabs --> Multi["multiplayer.tsx"]
Tabs --> Game["gamelayout.tsx"]
Root --> Theme["ThemeProvider"]
Root --> Settings["SettingsProvider"]
Root --> Auth["useAuth"]
```

**Diagram sources**
- [app/_layout.tsx](file://app/_layout.tsx#L1-L126)
- [app/(tabs)/main.tsx](file://app/(tabs)/main.tsx#L1-L800)
- [app/(tabs)/multiplayer.tsx](file://app/(tabs)/multiplayer.tsx#L1-L342)
- [app/(tabs)/gamelayout.tsx](file://app/(tabs)/gamelayout.tsx#L1-L800)

**Section sources**
- [app/_layout.tsx](file://app/_layout.tsx#L1-L126)
- [app/(tabs)/main.tsx](file://app/(tabs)/main.tsx#L1-L800)
- [app/(tabs)/multiplayer.tsx](file://app/(tabs)/multiplayer.tsx#L1-L342)
- [app/(tabs)/gamelayout.tsx](file://app/(tabs)/gamelayout.tsx#L1-L800)

## Dependency Analysis
- UI depends on providers and hooks for state
- Business logic is isolated in lib modules and imported by UI
- Supabase client is injected via a factory with platform-specific storage
- Realtime subscriptions are scoped per feature (matchmaking)

```mermaid
graph TB
UI["UI Screens"] --> Prov["Providers"]
UI --> BL["Business Logic"]
BL --> SA["Supabase Abstraction"]
SA --> SB["Supabase Client"]
BL --> RT["Realtime Channels"]
```

**Diagram sources**
- [supabase.ts](file://supabase.ts#L42-L74)
- [lib/matchmaking.ts](file://lib/matchmaking.ts#L204-L247)
- [lib/gameEngine.ts](file://lib/gameEngine.ts#L1-L284)

**Section sources**
- [supabase.ts](file://supabase.ts#L1-L75)
- [lib/matchmaking.ts](file://lib/matchmaking.ts#L1-L542)
- [lib/gameEngine.ts](file://lib/gameEngine.ts#L1-L284)

## Performance Considerations
- Minimize re-renders by using memoization and refs for frequently changing state (e.g., timers, drag state)
- Persist settings and theme to avoid repeated IO on startup
- Use platform-aware splash and font loading to reduce perceived latency
- Offload heavy computations to worker threads if needed; current logic is pure and fast
- Debounce or throttle real-time updates where appropriate

## Troubleshooting Guide
- Authentication failures: Verify environment variables for Supabase URL and keys; check network connectivity and browser redirect URLs for OAuth
- Realtime subscription issues: The matchmaking service includes a polling fallback; monitor logs for channel subscription errors
- Theme not applying: Ensure ThemeProvider wraps the app and AsyncStorage is available on native; verify theme keys and color resolution
- Game state desync: Confirm deterministic seeding and that multiplayer initial state is derived from match seed

**Section sources**
- [README.md](file://README.md#L13-L26)
- [supabase.ts](file://supabase.ts#L51-L55)
- [lib/matchmaking.ts](file://lib/matchmaking.ts#L491-L511)
- [context/ThemeContext.tsx](file://context/ThemeContext.tsx#L77-L89)
- [lib/gameEngine.ts](file://lib/gameEngine.ts#L60-L100)

## Conclusion
The Palindrome system combines a clean provider-based state model, a robust Supabase backend, and a shared game engine to deliver a consistent cross-platform experience. The architecture emphasizes separation of concerns, real-time multiplayer synchronization, and a scalable theme/settings system. By keeping business logic pure and centralized, the system remains maintainable and extensible for future enhancements.