import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { log, color } from "./utils/colors";

const scriptDir = __dirname;
const appDir = path.resolve(scriptDir, "..");
const androidDir = path.join(appDir, "android");

// 1. Auto-detect JAVA_HOME (prefer JDK 21 from Android Studio JBR if present)
let javaHome = process.env.JAVA_HOME;
if (fs.existsSync("/opt/android-studio/jbr")) {
    javaHome = "/opt/android-studio/jbr";
} else if (!javaHome && fs.existsSync("/usr/lib/jvm/java-21-openjdk")) {
    javaHome = "/usr/lib/jvm/java-21-openjdk";
}

// 2. Auto-detect ANDROID_HOME (prefer uppercase Sdk on Linux if present)
let androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!androidHome) {
    const homeDir = process.env.HOME || "";
    const capitalSdk = path.join(homeDir, "Android", "Sdk");
    const lowerSdk = path.join(homeDir, "Android", "sdk");

    if (fs.existsSync(capitalSdk)) {
        androidHome = capitalSdk;
    } else if (fs.existsSync(lowerSdk)) {
        androidHome = lowerSdk;
    } else {
        androidHome = capitalSdk;
    }
}

// 3. Ensure local.properties exists in android/ directory
if (fs.existsSync(androidDir)) {
    const localPropsPath = path.join(androidDir, "local.properties");
    const sdkDirEntry = `sdk.dir=${androidHome.replace(/\\/g, "/")}`;
    if (!fs.existsSync(localPropsPath)) {
        fs.writeFileSync(localPropsPath, `${sdkDirEntry}\n`);
    } else {
        let content = fs.readFileSync(localPropsPath, "utf8");
        if (!content.includes("sdk.dir=")) {
            content += `\n${sdkDirEntry}\n`;
            fs.writeFileSync(localPropsPath, content);
        }
    }
}

// 4. Set up environment variables
const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...(javaHome ? { JAVA_HOME: javaHome } : {}),
    ANDROID_HOME: androidHome,
    PATH: `${javaHome ? `${javaHome}/bin:` : ""}${androidHome}/platform-tools:${androidHome}/tools:${process.env.PATH || ""}`,
};

const passArgs = process.argv.slice(2);
log.info(`Launching Android app with Expo...`);
if (javaHome) console.log(`   ${color.dim("JAVA_HOME:")}    ${javaHome}`);
console.log(`   ${color.dim("ANDROID_HOME:")} ${androidHome}`);

const res = spawnSync("bunx", ["expo", "run:android", ...passArgs], {
    cwd: appDir,
    env,
    stdio: "inherit",
});

process.exit(res.status ?? 0);
