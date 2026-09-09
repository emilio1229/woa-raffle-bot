import "dotenv/config";
import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { startAutoEndLoop } from "./autoEndmanager.js";
import { handleInteraction } from "./interactionCreate.js";

// BUTTON HANDLERS
import { handleBindSoul } from "./buttons/bindSoul.js";
import { handleUnbindSoul } from "./buttons/unbindSoul.js";
import { raffleStore } from "./raffleStore.js";

// Resolve directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Command collection
client.commands = new Collection();

// Path to raffle commands
const commandsPath = path.join(__dirname, "commands/raffle");

// Load all .js files in the raffle command folder
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);

  const imported = await import(`file://${filePath}`);
  const command = imported.default;

  if (!command || !command.data || !command.data.name) {
    console.error(`❌ Invalid command file: ${file}`);
    continue;
  }

  client.commands.set(command.data.name, command);
  console.log(`Loaded command: ${command.data.name}`);
}

// Bot ready
client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
  startAutoEndLoop(client);
});

// Interaction handler
client.on(Events.InteractionCreate, async interaction => {

  // 🔮 BUTTON HANDLING (THIS WAS MISSING)
  if (interaction.isButton()) {
    const messageId = interaction.message.id;
    const raffleId = raffleStore.getIdByMessage(messageId);

    if (!raffleId) {
      return interaction.reply({
        content: "❌ This ritual is no longer active.",
        ephemeral: true
      });
    }

    if (interaction.customId === "bindSoul") {
      return handleBindSoul(interaction, raffleId);
    }

    if (interaction.customId === "unbindSoul") {
      return handleUnbindSoul(interaction, raffleId);
    }

    return; // stop here, do NOT send to slash handler
  }

  // Slash commands
  await handleInteraction(interaction);
});

// Login
client.login(process.env.TOKEN);
