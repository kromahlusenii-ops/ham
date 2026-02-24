# Platform Reference

Platform-specific directory structures, source directories, and brownfield analysis checklists.

## Table of Contents

- [Source Directories](#source-directories)
- [Directory Structures](#directory-structures)
  - [iOS (Swift/SwiftUI)](#ios)
  - [Android (Kotlin/Compose)](#android)
  - [Flutter](#flutter)
  - [React Native](#react-native)
- [Brownfield Analysis Checklists](#brownfield-analysis-checklists)
  - [Web (JS/TS)](#web-analysis)
  - [iOS Analysis](#ios-analysis)
  - [Android Analysis](#android-analysis)
  - [Flutter Analysis](#flutter-analysis)
  - [React Native Analysis](#react-native-analysis)

---

## Source Directories

Use these to determine project maturity and to set the `[source root]` in operating instructions.

| Platform | Source Directory |
|---|---|
| Web (JS/TS) | `src/` or `app/` |
| iOS | Project folder matching `.xcodeproj` name, or `Sources/` |
| Android | `app/src/main/java/` or `app/src/main/kotlin/` |
| Flutter | `lib/` |
| React Native | `src/` or `app/` |

---

## Directory Structures

### iOS

```
MyApp/
├── CLAUDE.md                     # Stack, min iOS, architecture pattern
├── .memory/
│   ├── decisions.md              # Confirmed ADRs
│   ├── patterns.md               # Confirmed patterns
│   ├── inbox.md                  # Inferred items awaiting confirmation
│   └── audit-log.md              # Audit history (auto-maintained)
├── MyApp/
│   ├── CLAUDE.md                 # Entry point, DI, app lifecycle
│   ├── Features/
│   │   ├── Auth/
│   │   │   └── CLAUDE.md         # Auth flow, Keychain, biometrics
│   │   └── Feed/
│   │       └── CLAUDE.md         # Pagination, caching, data refresh
│   ├── Core/
│   │   ├── Networking/
│   │   │   └── CLAUDE.md         # URLSession/Alamofire, token refresh, errors
│   │   └── Persistence/
│   │       └── CLAUDE.md         # SwiftData/CoreData, migrations
│   └── UI/
│       └── CLAUDE.md             # Design system, theming
└── MyAppTests/
    └── CLAUDE.md                 # XCTest conventions, mock patterns
```

### Android

```
app/
├── CLAUDE.md                     # Kotlin version, min SDK, Gradle conventions
├── .memory/
│   ├── decisions.md              # Confirmed ADRs
│   ├── patterns.md               # Confirmed patterns
│   ├── inbox.md                  # Inferred items awaiting confirmation
│   └── audit-log.md              # Audit history (auto-maintained)
├── app/src/main/
│   ├── CLAUDE.md                 # Manifest, ProGuard, build variants
│   ├── java/com/myapp/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── CLAUDE.md     # Auth, EncryptedSharedPrefs, biometrics
│   │   │   └── feed/
│   │   │       └── CLAUDE.md     # Paging 3, Room caching
│   │   ├── core/
│   │   │   ├── network/
│   │   │   │   └── CLAUDE.md     # Retrofit/Ktor, interceptors, errors
│   │   │   └── data/
│   │   │       └── CLAUDE.md     # Room, repository pattern, data sources
│   │   └── ui/
│   │       └── CLAUDE.md         # Compose theme, design tokens
│   └── res/
│       └── CLAUDE.md             # Resource naming, strings, drawables
└── app/src/test/
    └── CLAUDE.md                 # JUnit/Turbine, fake vs mock
```

### Flutter

```
my_app/
├── CLAUDE.md                     # Dart/Flutter version, state management
├── .memory/
│   ├── decisions.md              # Confirmed ADRs
│   ├── patterns.md               # Confirmed patterns
│   ├── inbox.md                  # Inferred items awaiting confirmation
│   └── audit-log.md              # Audit history (auto-maintained)
├── lib/
│   ├── CLAUDE.md                 # Shared Dart conventions, barrel files
│   ├── features/
│   │   ├── auth/
│   │   │   └── CLAUDE.md         # Auth flow, secure storage, tokens
│   │   └── feed/
│   │       └── CLAUDE.md         # Pagination, caching, state management
│   ├── core/
│   │   ├── network/
│   │   │   └── CLAUDE.md         # Dio/http, interceptors, errors
│   │   └── data/
│   │       └── CLAUDE.md         # Drift/Hive/Isar, models, data sources
│   └── ui/
│       └── CLAUDE.md             # Theme, design tokens, custom widgets
├── ios/
│   └── CLAUDE.md                 # Podfile, Info.plist, platform channels
├── android/
│   └── CLAUDE.md                 # Gradle, manifest, platform channels
└── test/
    └── CLAUDE.md                 # Widget vs unit tests, golden tests
```

### React Native

```
my_app/
├── CLAUDE.md                     # RN version, min iOS/Android, navigation
├── .memory/
│   ├── decisions.md              # Confirmed ADRs
│   ├── patterns.md               # Confirmed patterns
│   ├── inbox.md                  # Inferred items awaiting confirmation
│   └── audit-log.md              # Audit history (auto-maintained)
├── src/
│   ├── CLAUDE.md                 # Shared JS/TS conventions
│   ├── features/
│   │   └── [feature]/
│   │       └── CLAUDE.md         # Feature-specific context
│   ├── core/
│   │   ├── api/
│   │   │   └── CLAUDE.md         # API client, auth tokens, errors
│   │   └── storage/
│   │       └── CLAUDE.md         # AsyncStorage/MMKV, persistence
│   └── ui/
│       └── CLAUDE.md             # Component library, theming
├── ios/
│   └── CLAUDE.md                 # Xcode config, Podfile, native modules
└── android/
    └── CLAUDE.md                 # Gradle config, native modules, variants
```

For platforms not listed (Rust, Go, Python backend, etc.), follow the same principle: one root file, one file per major code area, scoped to what's needed in that area.

---

## Brownfield Analysis Checklists

When analyzing an existing codebase (Path C), read these platform-specific files and patterns.

### Web Analysis

Read and analyze:
- `package.json` for dependencies, scripts, framework version
- Config files: `next.config.js`, `tsconfig.json`, auth config, DB config
- API client setup, middleware, route structure

### iOS Analysis

Read and analyze:
- `.xcodeproj` or `Package.swift` for targets, dependencies, min deployment target
- `Info.plist` for capabilities and permissions
- Dependency manager: `Package.swift` (SPM), `Podfile` (CocoaPods), or `Cartfile`
- Architecture patterns: check for ViewModels, Coordinators, TCA stores
- Persistence: CoreData models (`.xcdatamodeld`), SwiftData `@Model` declarations
- Networking: URLSession wrappers, Alamofire/Moya setup

**Decisions to look for:** SwiftUI vs UIKit, architecture (MVVM, TCA, VIPER, Clean), persistence (SwiftData, Core Data, Realm), networking (URLSession, Alamofire, Moya), dependency management (SPM, CocoaPods), navigation (NavigationStack, Coordinator), concurrency (async/await, Combine, GCD).

### Android Analysis

Read and analyze:
- `build.gradle` / `build.gradle.kts` for dependencies, SDK versions, build variants
- `AndroidManifest.xml` for permissions and components
- Dependency injection: Hilt modules (`@Module`), Koin modules
- Architecture: ViewModel usage, Repository pattern, UseCases
- Persistence: Room `@Database` and `@Entity` declarations, DataStore
- Networking: Retrofit interfaces, Ktor client setup

**Decisions to look for:** Compose vs XML, DI (Hilt, Koin, manual), architecture (MVVM, MVI, Clean layers), persistence (Room, DataStore, SQLDelight), networking (Retrofit, Ktor), navigation (Compose, Component, custom), module structure (single, feature, clean arch modules).

### Flutter Analysis

Read and analyze:
- `pubspec.yaml` for dependencies, SDK constraints, assets
- State management: Riverpod providers, Bloc cubits, GetX controllers
- Platform channels in `ios/` and `android/`
- Navigation: GoRouter config, Navigator setup

**Decisions to look for:** State management (Riverpod, Bloc, GetX, Provider), navigation (GoRouter, auto_route, Navigator 2.0), persistence (Drift, Hive, Isar, sqflite), networking (Dio, http, Chopper), code gen (freezed, json_serializable), architecture (feature-first, layer-first, clean).

### React Native Analysis

Read and analyze:
- `package.json` for RN version, navigation library, state management
- `app.json` / `expo.json` for Expo config if applicable
- Native modules in `ios/` and `android/`
- Metro/babel config for transforms and aliases

**Decisions to look for:** Expo vs bare, navigation (React Navigation, Expo Router), state (Zustand, Redux Toolkit, Jotai, MobX), persistence (MMKV, AsyncStorage, WatermelonDB), styling (StyleSheet, styled-components, NativeWind), New Architecture enabled, Hermes vs JSC.
