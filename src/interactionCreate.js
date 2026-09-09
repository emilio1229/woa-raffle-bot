// src/interactionCreate.js
import { raffleStore } from "./raffleStore.js";
import { buildRaffleEmbed } from "./embedBuilder.js";

// Correct imports based on your actual folder structure
import { handleBindSoul } from "./buttons/bindSoul.js";
import { handleUnbindSoul } from "./buttons/unbindSoul.js";

/**
 * Named export required by src/index.js
 * handleInteraction handles commands, buttons, and select menus.
 */
export async function handleInteraction(interaction) {
  try {
    // Chat input commands
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    // Button interactions
    if (interaction.isButton()) {
      try {
        await interaction.deferUpdate();
      } catch {
        try { await interaction.reply({ content: "Processing…", flags: 64 }); } catch {}
      }

      const [action, raffleId] = interaction.customId.split("_");
      const raffle = raffleStore.findById(raffleId);

      if (!raffle
