# File Templates

Starter templates for every file in the hierarchical memory system. Adapt content to the user's actual stack and codebase.

## Table of Contents

- [Root CLAUDE.md Templates](#root-templates) (per platform)
- [Subdirectory CLAUDE.md Template + Examples](#subdirectory-templates)
- [decisions.md Template](#decisions-template)
- [patterns.md Template](#patterns-template)
- [inbox.md Template](#inbox-template)
- [Session Scratchpad Template](#session-template)

---

## Root CLAUDE.md Templates

Each root template has three sections: Stack, Critical Rules, and the Operating Instructions block from SKILL.md. Below are the Stack and Critical Rules per platform. Append the full Operating Instructions block from SKILL.md to each, replacing `[source root]` with the platform's source directory.

### Web

```markdown
# Project: [Name]

## Stack
- Framework: [e.g., Next.js 15 (App Router)]
- Language: [e.g., TypeScript (strict)]
- Database: [e.g., Supabase (Postgres + Auth + Realtime)]
- Styling: [e.g., Tailwind CSS]
- Deployment: [e.g., Vercel]

## Critical Rules
- Never modify .env files directly
- All DB changes go through migrations
- Use server actions for mutations, not API routes
- Types live in /src/types — never inline complex types
```

### iOS

```markdown
# Project: [Name]

## Stack
- Language: Swift [version]
- UI: SwiftUI (min iOS [version])
- Architecture: [MVVM | TCA | VIPER | MVC]
- Persistence: [SwiftData | Core Data | Realm | UserDefaults only]
- Networking: [URLSession | Alamofire | Moya]
- Dependencies: [SPM | CocoaPods]
- CI/CD: [Xcode Cloud | Fastlane | GitHub Actions]

## Critical Rules
- All new views use SwiftUI — no new UIKit screens
- Keychain for sensitive data, UserDefaults for preferences only
- Never force-unwrap optionals outside of IBOutlets
- All network calls go through Core/Networking — no direct URLSession
- Run SwiftLint before committing
```

### Android

```markdown
# Project: [Name]

## Stack
- Language: Kotlin [version]
- UI: [Jetpack Compose | XML Views | Hybrid]
- Architecture: [MVVM | MVI] with [Hilt | Koin | Manual DI]
- Min SDK: [version] / Target SDK: [version]
- Persistence: [Room | DataStore | SQLDelight]
- Networking: [Retrofit + OkHttp | Ktor]
- Build: Gradle [KTS | Groovy], [single module | multi-module]

## Critical Rules
- All new UI in Compose — no new XML layouts
- EncryptedSharedPreferences for sensitive data, DataStore for preferences
- ViewModels expose StateFlow, never LiveData in new code
- All network calls go through repository layer — no direct Retrofit from ViewModels
- Never store Context references in ViewModels
```

### Flutter

```markdown
# Project: [Name]

## Stack
- Language: Dart [version]
- Framework: Flutter [version]
- Min iOS: [version] / Min Android SDK: [version]
- State Management: [Riverpod | Bloc | GetX | Provider]
- Navigation: [GoRouter | Navigator 2.0 | AutoRoute]
- Persistence: [Drift | Hive | Isar | SharedPreferences only]
- Networking: [Dio | http]
- CI/CD: [Codemagic | GitHub Actions | Fastlane]

## Critical Rules
- All state management through [chosen solution] — no mixing
- Secure storage for tokens, SharedPreferences for non-sensitive only
- Platform channels in lib/core/platform/ with method channel wrappers
- No business logic in widgets — extract to providers/blocs/controllers
- All models use freezed for immutability and JSON serialization
```

### React Native

```markdown
# Project: [Name]

## Stack
- Framework: React Native [version] [Expo | Bare]
- Language: TypeScript (strict)
- Navigation: [React Navigation | Expo Router]
- State: [Zustand | Redux Toolkit | Jotai]
- Persistence: [MMKV | AsyncStorage]
- Networking: [Axios | fetch + custom client]
- Native: [Hermes enabled | JSC], [New Architecture | Old]

## Critical Rules
- All new components use functional components with hooks
- Sensitive data in react-native-keychain, preferences in MMKV
- No inline styles — use StyleSheet.create or styled-components
- Platform-specific code uses .ios.tsx/.android.tsx suffixes
- Native modules must have both iOS and Android implementations before merging
```

Target for all root files: under 250 tokens (~60 lines) including the Operating Instructions block.

---

## Subdirectory CLAUDE.md Template

```markdown
# [Directory Name] Context

## Purpose
[One sentence: what this directory is responsible for]

## Conventions
- [Convention specific to this directory]

## Active Integrations
- [Integration]: [One-line description]

## Key Patterns
- [Pattern name]: [One-line description, or reference to .memory/patterns.md]

## Gotchas
- [Non-obvious thing that will trip up an agent]
```

Target: under 300 tokens (~75 lines). Only include what's needed to work in this directory.

### Example: Web — /src/api/CLAUDE.md

```markdown
# API Layer Context

## Purpose
Server-side API routes handling authenticated requests and external integrations.

## Conventions
- All protected routes use getServerSession() — never raw JWT parsing
- Middleware handles redirect; route handlers assume authenticated user
- Response format: always { data: T | null, error: string | null }
- Never throw from route handlers — catch and return error responses

## Active Integrations
- Reddit API: OAuth app flow, token refresh in /src/lib/reddit.ts
- X/Twitter API: v2 endpoints, bearer token auth
- OpenAI: text-embedding-3-small for embeddings only
- Anthropic: claude-sonnet-4-5 for analysis/generation

## Gotchas
- Rate limiting via upstash/ratelimit — config in /src/lib/ratelimit.ts
- Reddit token expires hourly — always use refresh wrapper
```

### Example: Web — /src/components/CLAUDE.md

```markdown
# Component Conventions

## Purpose
Reusable UI components with consistent structure and styling.

## Conventions
- Each component folder: ComponentName.tsx, index.ts (re-export), optional test
- Tailwind only — no CSS modules, no styled-components
- Use cn() from /src/lib/utils for conditional classes
- All interactive components need loading and error states

## Key Patterns
- Form: React Hook Form + Zod schema — see .memory/patterns.md
- Data table: tanstack/react-table wrapper — see .memory/patterns.md

## Gotchas
- Never import server-only code into components — use 'use client' directive
- Icons: lucide-react only
```

### Example: iOS — Features/Auth/CLAUDE.md

```markdown
# Auth Feature Context

## Purpose
User authentication: sign in, sign up, password reset, biometric unlock.

## Conventions
- AuthViewModel handles all auth state — views observe @Published properties
- Tokens stored in Keychain via KeychainService in Core/Security
- Never store tokens in UserDefaults or @AppStorage
- Auth state publishes through AuthManager (singleton, @Environment)

## Key Patterns
- Biometric: LAContext with fallback to passcode — see .memory/patterns.md
- Token refresh: automatic via AuthInterceptor before 401

## Gotchas
- Keychain items persist across app delete/reinstall — handle first-launch cleanup
- Simulator doesn't support Face ID by default — enable in Features menu
```

### Example: Android — features/auth/CLAUDE.md

```markdown
# Auth Feature Context

## Purpose
User authentication: sign in, sign up, password reset, biometric prompt.

## Conventions
- AuthViewModel exposes StateFlow<AuthUiState> (sealed interface)
- Tokens in EncryptedSharedPreferences via TokenManager (Hilt-injected)
- Never store tokens in regular SharedPreferences or DataStore
- Auth state from AuthRepository (singleton, @Singleton)

## Key Patterns
- Biometric: BiometricPrompt with CryptoObject — see .memory/patterns.md
- Token refresh: OkHttp Authenticator, synchronized to prevent parallel refreshes

## Gotchas
- EncryptedSharedPreferences can throw on first access after OS update
- Credential Manager requires activity context, not application context
```

### Example: Flutter — lib/features/auth/CLAUDE.md

```markdown
# Auth Feature Context

## Purpose
User authentication: sign in, sign up, password reset, biometric unlock.

## Conventions
- Auth state managed by AuthNotifier (Riverpod AsyncNotifier)
- Tokens in flutter_secure_storage — never SharedPreferences
- Auth state changes trigger GoRouter redirect via ref.listen
- All auth API calls go through AuthRepository, never direct Dio

## Key Patterns
- Biometric: local_auth, check canCheckBiometrics before prompting
- Token refresh: Dio interceptor queues during refresh — see .memory/patterns.md

## Gotchas
- flutter_secure_storage requires min iOS 12 and Android API 23
- GoRouter redirect must not be async — check cached auth state
```

---

## decisions.md Template

```markdown
# Architecture Decision Records

Format:

### ADR-[NNN]: [Title] ([Date])
**Status:** [active | superseded | deprecated]
**Context:** What problem or choice prompted this
**Decision:** What was chosen
**Alternatives Considered:** What was rejected, with brief reasoning
**Consequences:** What this means for future development

---

### ADR-001: [Example — Use Supabase over Firebase] (2026-01-15)
**Status:** active
**Context:** Needed backend with auth, database, and realtime.
**Decision:** Supabase — Postgres-based, open source, built-in RLS.
**Alternatives Considered:**
- Firebase: NoSQL would require more data transformation; vendor lock-in
- Custom (Express + Postgres): More control but significant time for auth/realtime
**Consequences:** Relational data modeling. Auth via Supabase Auth. Migrations via Supabase CLI.
```

Never delete entries. Mark outdated decisions as `[superseded]` and add a new entry.

---

## patterns.md Template

```markdown
# Reusable Patterns

Format:

### [Pattern Name]
**When to use:** [Situation that calls for this pattern]
**Implementation:**
```[language]
// Concise code example — minimum to implement correctly
```
**Gotchas:**
- [Non-obvious edge case or common mistake]

---

### [Example — Authenticated API Response]
**When to use:** Any API route returning data to an authenticated user
**Implementation:**
```typescript
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    const data = await fetchData(session.user.id);
    return NextResponse.json({ data, error: null });
  } catch (e) {
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
```
**Gotchas:**
- Never throw from route handlers — always catch and return structured error
- Always check session before data access
```

---

## inbox.md Template

```markdown
# Memory Inbox

Items here are inferred or unconfirmed. Review periodically:
- **Confirm:** Move to decisions.md or patterns.md, delete from here.
- **Reject:** Delete if incorrect.
- **Revise:** Edit to be accurate, then promote.

---

### Inferred Decision: [Title] ([Date])
**Confidence:** [high | medium | low]
**Evidence:** [File paths or config suggesting this]
**Observed:** [What the agent saw]
**Proposed ADR:** [What the decision would be if confirmed]

### Inferred Pattern: [Title] ([Date])
**Confidence:** [high | medium | low]
**Evidence:** [File paths showing consistent usage]
**Observed:** [Brief description]
**Used in:** [Files where this pattern appears]
```

The inbox is never authoritative context. The agent reads `decisions.md` and `patterns.md` for confirmed knowledge. It writes to `inbox.md` only for uncertain inferences.

---

## Session Scratchpad Template

```markdown
# Session: [YYYY-MM-DD]

## Goals
- [What the developer intended to accomplish]

## Changes Made
- [Directory/file]: [What changed and why]

## Decisions Made
- [Decision to log to decisions.md]

## Open Questions
- [Things to resolve next session]
```

Session scratchpads are disposable. Archive or delete after decisions and patterns are captured in their permanent files.
