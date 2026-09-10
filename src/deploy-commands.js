import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { REST, Routes } from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCommandFiles(commandsRoot) {
  return fs.readdirSync(commandsRoot, { recursive: true })
    .filter(file => file.endsWith(".js"))
    .map(file => path.join(commandsRoot, file));
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

try {
  console.log("Deploying slash commands…");
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("Slash commands deployed.");
} catch (error) {
  console.error(error);
}
