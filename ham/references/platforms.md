# Platforms

Use this reference to choose source roots and likely scope boundaries when running `go ham`.

## Source Roots

- Web: `src/` or `app/`
- iOS: project directory matching `.xcodeproj`, or `Sources/`
- Android: `app/src/main/java/` or `app/src/main/kotlin/`
- Flutter: `lib/`
- React Native: `src/` or `app/`

## Platform Signals

- iOS: `*.xcodeproj`, `Package.swift`
- Android: `build.gradle`, `build.gradle.kts`, `settings.gradle`
- Flutter: `pubspec.yaml`
- React Native: `package.json` with `react-native`
- Web: `package.json` with `next`, `nuxt`, `vite`, `svelte`, or similar framework signals
- Python: `pyproject.toml`, `requirements.txt`
- Rust: `Cargo.toml`
- Go: `go.mod`

## Brownfield Hints

When scoping a brownfield repo, prioritize directories where local guidance changes implementation behavior:

- API layers
- shared UI or components
- persistence or data layers
- mobile feature modules
- test directories with specialized fixture patterns

Do not create scoped `CLAUDE.md` files for every directory. Create them only where local conventions, integrations, or gotchas differ materially from the parent scope.
