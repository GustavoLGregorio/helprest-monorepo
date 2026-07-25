import fs from "node:fs";
import path from "node:path";
import { log } from "./utils/colors";

const BUILD_GRADLE_PATH = path.join(
    __dirname,
    "..",
    "android",
    "app",
    "build.gradle",
);

function patchSigning(): void {
    if (!fs.existsSync(BUILD_GRADLE_PATH)) {
        log.error("build.gradle not found. Run expo prebuild first.");
        process.exit(1);
    }

    let content = fs.readFileSync(BUILD_GRADLE_PATH, "utf8");
    const keystoreJksPath = path.join(__dirname, "..", "keys", "keystore.jks");
    const hasProjectKeystore = fs.existsSync(keystoreJksPath);

    const projectSigningBlock = `    signingConfigs {
        debug {
            ${hasProjectKeystore ? "storeFile file('../../keys/keystore.jks')\n            storePassword '74bf17c9dd20d10911aa48e1490f8171'\n            keyAlias '0d33bb73fe7a6b8ae839b001b6696f06'\n            keyPassword '619e9a2516524d7d30f3f7b7aa249bde'" : "storeFile file('debug.keystore')\n            storePassword 'android'\n            keyAlias 'androiddebugkey'\n            keyPassword 'android'"}
        }
        release {
            ${hasProjectKeystore ? "storeFile file('../../keys/keystore.jks')\n            storePassword '74bf17c9dd20d10911aa48e1490f8171'\n            keyAlias '0d33bb73fe7a6b8ae839b001b6696f06'\n            keyPassword '619e9a2516524d7d30f3f7b7aa249bde'" : "storeFile file('debug.keystore')\n            storePassword 'android'\n            keyAlias 'androiddebugkey'\n            keyPassword 'android'"}
        }
    }`;

    content = content.replace(
        /signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\}\s*\}/,
        projectSigningBlock,
    );
    content = content.replace(
        /signingConfig signingConfigs\.debug/g,
        "signingConfig signingConfigs.release",
    );

    fs.writeFileSync(BUILD_GRADLE_PATH, content, "utf8");
    log.success(
        `Patched android/app/build.gradle with ${hasProjectKeystore ? "project keystore.jks" : "debug.keystore"}.`,
    );
}

const STYLES_XML_PATH = path.join(
    __dirname,
    "..",
    "android",
    "app",
    "src",
    "main",
    "res",
    "values",
    "styles.xml",
);

const EDGE_TO_EDGE_STYLE = `
    <!--
        Theme.EdgeToEdge: base theme required by Expo's edgeToEdgeEnabled flag.
        Defined directly to avoid adding an extra dependency solely for this style definition.
    -->
    <style name="Theme.EdgeToEdge" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="android:navigationBarColor">@android:color/transparent</item>
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:windowTranslucentNavigation">false</item>
        <item name="android:windowTranslucentStatus">false</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    </style>`;

function patchStyles(): void {
    if (!fs.existsSync(STYLES_XML_PATH)) {
        log.warn("styles.xml not found. Skipping style patch.");
        return;
    }

    let content = fs.readFileSync(STYLES_XML_PATH, "utf8");

    if (content.includes('name="Theme.EdgeToEdge"')) {
        log.info("Theme.EdgeToEdge is already defined in styles.xml.");
        return;
    }

    content = content.replace(
        /(<resources[^>]*>)/,
        `$1${EDGE_TO_EDGE_STYLE}\n`,
    );

    fs.writeFileSync(STYLES_XML_PATH, content, "utf8");
    log.success("Patched styles.xml with Theme.EdgeToEdge definition.");
}

const LOCAL_PROPERTIES_PATH = path.join(
    __dirname,
    "..",
    "android",
    "local.properties",
);

function patchLocalProperties(): void {
    const defaultSdkDir =
        process.env.ANDROID_HOME ||
        process.env.ANDROID_SDK_ROOT ||
        "/home/gustavo/Android/Sdk";
    if (!fs.existsSync(LOCAL_PROPERTIES_PATH)) {
        fs.writeFileSync(
            LOCAL_PROPERTIES_PATH,
            `sdk.dir=${defaultSdkDir}\n`,
            "utf8",
        );
        log.success(`Created local.properties with sdk.dir=${defaultSdkDir}`);
        return;
    }

    let content = fs.readFileSync(LOCAL_PROPERTIES_PATH, "utf8");
    if (!content.includes("sdk.dir=")) {
        content += `\nsdk.dir=${defaultSdkDir}\n`;
        fs.writeFileSync(LOCAL_PROPERTIES_PATH, content, "utf8");
        log.success("Added sdk.dir to local.properties.");
    }
}

// ─── Run all patches ──────────────────────────────────────────────────────────

patchSigning();
patchStyles();
patchLocalProperties();
