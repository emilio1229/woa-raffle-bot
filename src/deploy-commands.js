import "dotenv/config";
import fs from "fs";
import path from "path";
import { REST, Routes } from "discord.js";
import { fileURLToPath } from "url";

// Arcane shimmer logging
function arcaneLog(msg) {
  console.log(`✨🔮 ${msg} 🔮✨`);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recursively walk folders to auto-detect commands
function getAllCommandFiles(dir) {
  let results = [];

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllCommandFiles(filePath));
    } else if (file.endsWith(".js")) {
      results.push(filePath);
    }
  }

  return results;
}

// Scan the entire commands folder (multiple folders supported)
const commandsDir = path.join(__dirname, "src/commands");
const commandFiles = getAllCommandFiles(commandsDir);

arcaneLog(`Found ${commandFiles.length} enchanted command scrolls…`);

const commands = [];

for (const filePath of commandFiles) {
  const command = await import(`file://${filePath}`);

  if (!command.data) {
    arcaneLog(`Skipping ${filePath} — no command data found.`);
    continue;
  }

  commands.push(command.data.toJSON());
  arcaneLog(`Bound spell: ${command.data.name}`);
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

try {
  arcaneLog("Channeling arcane energy… updating slash commands…");

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  arcaneLog("The ritual is complete. Slash commands updated.");
} catch (error) {
  console.error(error);
  arcaneLog("⚠ The arcane ritual failed.");
}
