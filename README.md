# CM Mobile

React Native + Expo app for CM internal operations.

## Pinned toolchain versions

**Do NOT upgrade without a dedicated branch + full regression test.**

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20.x LTS | See `.nvmrc` |
| JDK | 17 (Temurin 17.0.19+) | `JAVA_HOME` env var |
| Expo SDK | 56.0.22 | Pinned exact in `package.json` |
| React Native | 0.85.3 | Pinned exact |
| Gradle | 8.13 | `android/gradle/wrapper/gradle-wrapper.properties` |
| Android compileSdk | 36 | |
| Android NDK | 27.1.12297006 | Required for C++ native modules |
| Android CMake | 3.22.1 | |
| Android Build Tools | 36.0.0 | |

## Environment prerequisites

- Install path for **Android SDK, project, and Gradle home MUST NOT contain spaces** (breaks ld.lld C++ linker on Windows).
- Required disk space: 15+ GB free on project drive.

### Windows env vars (set in system)

```
ANDROID_HOME        D:\android-sdk
ANDROID_SDK_ROOT    D:\android-sdk
JAVA_HOME           C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
GRADLE_USER_HOME    D:\gradle-home
```

Add `%JAVA_HOME%\bin` to `Path` (at top).

Verify after opening new terminal:

```powershell
$env:ANDROID_HOME
$env:JAVA_HOME
$env:GRADLE_USER_HOME
java -version   # must print 17
```

## First-time setup

1. Clone to path without spaces (e.g. `D:\CM-Mobile`).
2. Install deps:
   ```bash
   npm install
   ```
3. Create `.env` from `.env_example`, fill `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_API_KEY`.
4. Generate android/ios folders:
   ```bash
   npx expo prebuild --platform android
   ```

## Build APK

Debug:

```bash
cd android
.\gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Release:

```bash
cd android
.\gradlew assembleRelease
```

## Upgrade policy

Mobile toolchain breaks on upgrade. Rules:

1. **Never** upgrade dependencies directly on `main`.
2. Create branch `upgrade-expo-NN` for each SDK upgrade.
3. Read Expo SDK release notes before: https://expo.dev/changelog
4. Run `npx expo install --fix` only inside upgrade branch.
5. Test every screen + build APK + install on physical device before merge.
6. Only upgrade when: forced by Play Store `targetSdk` deadline, security fix, or needed feature.

Google raises `targetSdkVersion` yearly (Aug deadline). That's the only mandatory annual upgrade.

## Troubleshooting

- **`Unsupported class file major version 69`**: JDK 25 in PATH. Fix `JAVA_HOME` to JDK 17, move `%JAVA_HOME%\bin` to top of `Path`.
- **`ld.lld: error: undefined symbol: std::__ndk1::mutex::lock()`**: SDK or Gradle home path contains spaces. Move to path without spaces.
- **`Espacio en disco insuficiente`**: free 15+ GB; delete `.cxx` folders in `node_modules/react-native-screens/android/` and `node_modules/react-native-worklets/android/`.
- **`Access denied for user ...@localhost`**: backend MySQL user missing or wrong password. Check `.env` of backend.
