import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { log, color } from "./utils/colors";

const root = process.cwd();
const oldDirs = ["app", "components", "hooks", "constants", "scripts"];
const exampleDir = "app-example";
const newAppDir = "app";
const exampleDirPath = path.join(root, exampleDir);

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function moveDirectories(userInput: string): Promise<void> {
    try {
        if (userInput === "y") {
            await fs.promises.mkdir(exampleDirPath, { recursive: true });
            log.info(`Created /${exampleDir} directory.`);
        }

        for (const dir of oldDirs) {
            const oldDirPath = path.join(root, dir);
            if (fs.existsSync(oldDirPath)) {
                if (userInput === "y") {
                    const newDirPath = path.join(root, exampleDir, dir);
                    await fs.promises.rename(oldDirPath, newDirPath);
                    log.info(`Moved /${dir} to /${exampleDir}/${dir}.`);
                } else {
                    await fs.promises.rm(oldDirPath, { recursive: true, force: true });
                    log.info(`Deleted /${dir}.`);
                }
            } else {
                log.info(`Directory /${dir} does not exist, skipping.`);
            }
        }

        const newAppDirPath = path.join(root, newAppDir);
        await fs.promises.mkdir(newAppDirPath, { recursive: true });
        log.info("Created new /app directory.");

        const indexPath = path.join(newAppDirPath, "index.tsx");
        await fs.promises.writeFile(indexPath, indexContent);
        log.info("Created app/index.tsx.");

        const layoutPath = path.join(newAppDirPath, "_layout.tsx");
        await fs.promises.writeFile(layoutPath, layoutContent);
        log.info("Created app/_layout.tsx.");

        log.success("Project reset complete. Next steps:");
        console.log(`1. Run ${color.cyan("bun run start")} to start the development server.`);
        console.log(`2. Edit ${color.cyan("app/index.tsx")} to modify the main screen.`);
        if (userInput === "y") {
            console.log(`3. Delete the /${exampleDir} directory when finished referencing it.`);
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        log.error(`Error during project reset: ${message}`);
    }
}

rl.question(
    "Do you want to move existing files to /app-example instead of deleting them? (Y/n): ",
    (answer) => {
        const userInput = answer.trim().toLowerCase() || "y";
        if (userInput === "y" || userInput === "n") {
            moveDirectories(userInput).finally(() => rl.close());
        } else {
            log.error("Invalid input. Please enter 'Y' or 'N'.");
            rl.close();
        }
    },
);
