#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export JAVA_HOME="$HOME/.local/jdk-17"
export ANDROID_HOME="$HOME/.local/android-sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "=================================================="
echo "🔨 Building Standalone Android APK (Bittrix Studio)"
echo "=================================================="
echo "Java Home:    $JAVA_HOME"
echo "Android Home: $ANDROID_HOME"
echo ""

cd "$PROJECT_ROOT/mobile-app/android"

# Run Gradle assembleRelease
./gradlew assembleRelease --no-daemon

APK_SRC="$PROJECT_ROOT/mobile-app/android/app/build/outputs/apk/release/app-release.apk"
APK_DEST="$PROJECT_ROOT/bittrix-studio.apk"

if [ -f "$APK_SRC" ]; then
  cp "$APK_SRC" "$APK_DEST"
  cp "$APK_SRC" "$PROJECT_ROOT/backend/media/bittrix-studio.apk"
  echo ""
  echo "=================================================="
  echo "✅ APK BUILD SUCCESSFUL!"
  echo "=================================================="
  echo "📱 Standalone APK ready at:"
  echo "   $APK_DEST"
  echo "   $PROJECT_ROOT/backend/media/bittrix-studio.apk"
  echo ""
  echo "You can now share 'bittrix-studio.apk' directly via WhatsApp, Telegram, or Drive!"
  echo "=================================================="
else
  echo "❌ APK build completed but output file was not found."
  exit 1
fi
