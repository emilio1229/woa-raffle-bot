import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { REST, Routes } from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TRUE RECURSIVE COMMAND SCAN
function getCommandFiles(dir) {
  let results = [];

  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getCommandFiles(fullPath));
    } else if (file.endsWith(".js")) {
      results.push(fullPath);
    }
  }

  return results;
}

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = getCommandFiles(commandsPath);

for (const filePath of commandFiles) {
  const imported = await import(`file://${filePath}`);
  const command = imported.default;

  if (!command || !command.data) continue;
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

async function deploy() {
  try {
    console.log("🧹 Clearing GLOBAL commands…");

    // DELETE ALL GLOBAL COMMANDS
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );

    console.log("✔ Global commands cleared.");

    console.log("🔮 Deploying slash commands to BOTH guilds…");

    // TESTING SERVER
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, "1498579289166188604"),
      { body: commands }
    );

    // MAIN WOA SERVER
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, "1428105944373526610"),
      { body: commands }
    );

    console.log("✨ Slash commands deployed INSTANTLY to both servers.");
  } catch (error) {
    console.error("❌ Deployment error:", error);
  }
}

deploy();
