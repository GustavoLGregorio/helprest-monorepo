import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { log, color } from "./utils/colors";

const scriptDir = __dirname;
const appDir = path.resolve(scriptDir, "..");

// 1. Auto-detect JAVA_HOME (prefer JDK 21 from Android Studio JBR if present)
let javaHome = process.env.JAVA_HOME;
if (fs.existsSync("/opt/android-studio/jbr")) {
    javaHome = "/opt/android-studio/jbr";
} else if (!javaHome) {
    javaHome = "/usr/lib/jvm/java-21-openjdk";
}

// 2. Auto-detect ANDROID_HOME
const androidHome =
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    path.join(process.env.HOME || "", "Android", "Sdk");

// 3. Ensure npm wrapper shim is created if npm is missing from system PATH
const binDir = path.join(scriptDir, ".bin");
fs.mkdirSync(binDir, { recursive: true });

function hasCommand(cmd: string): boolean {
    const res = spawnSync("which", [cmd], { encoding: "utf8" });
    return res.status === 0;
}

if (!hasCommand("npm")) {
    const npmShimPath = path.join(binDir, "npm");
    const npmShimCode = `#!/usr/bin/env node
const { execSync } = require('child_process');
const https = require('https');
const [,, cmd, pkg, field] = process.argv;

if (cmd === 'view' && pkg) {
    const sanitizedPkg = pkg.includes('/') && !pkg.startsWith('@') ? pkg : pkg.replace(/@([^/]+)$/, '/$1');
    const url = \`https://registry.npmjs.org/\${sanitizedPkg}\`;
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
    execSync(\`bun \${args}\`, { stdio: 'inherit' });
  } catch (e) { process.exit(e.status || 1); }
}
`;
    fs.writeFileSync(npmShimPath, npmShimCode, { mode: 0o755 });
}

// Prepare execution environment
const env = {
    ...process.env,
    JAVA_HOME: javaHome,
    ANDROID_HOME: androidHome,
    CI: "1",
    PATH: `${binDir}:${javaHome}/bin:${androidHome}/platform-tools:${process.env.PATH || ""}`,
};

const buildType = (process.argv[2] || "release").toLowerCase();
const gradleTask = buildType === "debug" ? "assembleDebug" : "assembleRelease";

log.info(
    `Initializing APK compilation build [${color.bold(buildType.toUpperCase())}]...`,
);
console.log(`   ${color.dim("JAVA_HOME:")}    ${javaHome}`);
console.log(`   ${color.dim("ANDROID_HOME:")} ${androidHome}`);
console.log(`   ${color.dim("BUILD_TYPE:")}   ${buildType}`);

// Execute prebuild:android (runs expo prebuild --clean + patch-android-signing.ts)
log.info("Executing Expo prebuild and signing patches...");
const prebuildRes = spawnSync("bun", ["run", "prebuild:android"], {
    cwd: appDir,
    env,
    stdio: "inherit",
});

if (prebuildRes.status !== 0) {
    log.error("Expo prebuild failed. Aborting APK compilation.");
    process.exit(prebuildRes.status || 1);
}

// Execute Gradle build task inside android directory
const androidDir = path.join(appDir, "android");
log.info(`Executing Gradle task :app:${gradleTask}...`);
const gradleRes = spawnSync("./gradlew", [gradleTask], {
    cwd: androidDir,
    env,
    stdio: "inherit",
});

if (gradleRes.status !== 0) {
    log.error(`Gradle ${gradleTask} compilation failed.`);
    process.exit(gradleRes.status || 1);
}

const apkPath = path.join(
    androidDir,
    "app",
    "build",
    "outputs",
    "apk",
    buildType,
    `app-${buildType}.apk`,
);

log.success(`APK compiled successfully!`);
log.info(`Output binary location: ${color.cyan(apkPath)}`);
