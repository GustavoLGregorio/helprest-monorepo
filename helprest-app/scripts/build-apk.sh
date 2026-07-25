#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# 1. Auto-detect JAVA_HOME (Prefer JDK 21 from Android Studio JBR if present)
if [ -d "/opt/android-studio/jbr" ]; then
    export JAVA_HOME="/opt/android-studio/jbr"
elif [ -z "$JAVA_HOME" ]; then
    export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
fi

# 2. Auto-detect ANDROID_HOME
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
fi

# 3. Create persistent npm wrapper shim if npm is missing from system PATH
BIN_DIR="$APP_DIR/scripts/.bin"
mkdir -p "$BIN_DIR"

if ! command -v npm &> /dev/null; then
    cat << 'EOF' > "$BIN_DIR/npm"
#!/usr/bin/env node
const { execSync } = require('child_process');
const https = require('https');
const [,, cmd, pkg, field] = process.argv;

if (cmd === 'view' && pkg) {
  const sanitizedPkg = pkg.includes('/') && !pkg.startsWith('@') ? pkg : pkg.replace(/@([^/]+)$/, '/$1');
  const url = `https://registry.npmjs.org/${sanitizedPkg}`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (field && parsed[field]) console.log(JSON.stringify(parsed[field]));
        else console.log(data);
      } catch (e) { console.error(e); process.exit(1); }
    });
  }).on('error', (e) => { console.error(e); process.exit(1); });
} else {
  try {
    const args = process.argv.slice(2).join(' ');
    execSync(`bun ${args}`, { stdio: 'inherit' });
  } catch (e) { process.exit(e.status || 1); }
}
EOF
    chmod +x "$BIN_DIR/npm"
fi

export PATH="$BIN_DIR:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
export CI=1

BUILD_TYPE="${1:-release}"

echo "[build-apk] 🚀 Environment initialized:"
echo "   JAVA_HOME=$JAVA_HOME"
echo "   ANDROID_HOME=$ANDROID_HOME"
echo "   BUILD_TYPE=$BUILD_TYPE"

cd "$APP_DIR"
bun run prebuild:android

cd android
if [ "$BUILD_TYPE" = "debug" ]; then
    ./gradlew assembleDebug
else
    ./gradlew assembleRelease
fi

echo "[build-apk] ✅ APK build finished successfully!"
