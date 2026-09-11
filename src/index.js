import "dotenv/config";
import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { startAutoEndLoop } from "./autoEndmanager.js";
import { handleInteraction } from "./interactionCreate.js";

// ⭐ ADD THIS IMPORT
import { startAstralSelection } from "./astralSelection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TRUE RECURSIVE SCAN
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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = getCommandFiles(commandsPath);

for (const filePath of commandFiles) {
  const imported = await import(`file://${filePath}`);
  const command = imported.default;

  if (!command || !command.data || !command.data.name) {
    console.error(`❌ Invalid command file: ${path.relative(commandsPath, filePath)}`);
    continue;
  }

  client.commands.set(command.data.name, command);
  console.log(`Loaded command: ${command.data.name}`);
}

client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);

  startAutoEndLoop(client);

  // ⭐ START ASTRAL SELECTION HERE
  startAstralSelection(client);
});

client.on(Events.InteractionCreate, async interaction => {
  await handleInteraction(interaction);
});

client.login(process.env.TOKEN);
