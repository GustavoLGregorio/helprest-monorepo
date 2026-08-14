// Compatibility patch for node:v8 startupSnapshot under Bun runtime
try {
    const v8 = require("node:v8");
    if (v8.startupSnapshot) {
        v8.startupSnapshot.isBuildingSnapshot = () => false;
    }
} catch {}
