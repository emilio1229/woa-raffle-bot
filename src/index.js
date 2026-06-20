import "dotenv/config";
import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { startAutoEndLoop } from "./autoEndmanager.js";
import { handleInteraction } from "./interactionCreate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = await import(`file://${filePath}`);
    client.commands.set(command.data.name, command);
    console.log(`Loaded command: ${command.data.name}`);
  }
}

// Updated event name for v15 compatibility
client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
  startAutoEndLoop(client);
});

// Updated interaction handler
client.on(Events.InteractionCreate, async interaction => {
  await handleInteraction(interaction);
});

client.login(process.env.TOKEN);
