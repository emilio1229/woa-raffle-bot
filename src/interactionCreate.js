// src/interactionCreate.js
import { raffleStore } from "./raffleStore.js";
import { buildRaffleEmbed } from "./embedBuilder.js";

// ⭐ Correct imports based on your actual folder structure
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
    if (interaction.isButton && interaction.isButton()) {
      // Acknowledge immediately to avoid double-clicks or Unknown interaction
      try {
        await interaction.deferUpdate();
      } catch {
        try { await interaction.reply({ content: "Processing…", flags: 64 }); } catch {}
      }

      const [action, raffleId] = interaction.customId.split("_");
      const raffle = raffleStore.findById(raffleId);

      if (!raffle) {
        try { await interaction.editReply({ content: "This raffle no longer exists.", components: [] }); } catch {}
        return;
      }

      // ⭐ Use your bind/unbind handlers
      if (action === "enter") {
        await handleBindSoul(interaction, raffleId);
        return;
      }

      if (action === "leave") {
        await handleUnbindSoul(interaction, raffleId);
        return;
      }

      return;
    }

    // Select menu interactions
    if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      // End raffle via select menu
      if (customId === "select_end_raffle") {
        try { await interaction.deferUpdate(); } catch {}
        const selected = interaction.values && interaction.values[0];
        if (!selected) return;
        const raffle = raffleStore.findById(selected);
        if (!raffle) {
          try { await interaction.editReply({ content: "Selected raffle not found.", components: [] }); } catch {}
          return;
        }

        try {
          raffleStore.markEnded(raffle.id);
          const updated = raffleStore.findById(raffle.id);
          const entries = updated.entries ?? [];
          let resultText;
          if (entries.length === 0) resultText = "No entries — no winner.";
          else {
            const winner = entries[Math.floor(Math.random() * entries.length)];
            resultText = `Winner: <@${winner}>`;
          }

          try {
            const channel = await interaction.client.channels.fetch(updated.channelId);
            const msg = await channel.messages.fetch(updated.messageId);
            const embed = buildRaffleEmbed(updated, updated.entries.length);
            await msg.edit({ embeds: [embed], components: [] });
          } catch {}

          try { await interaction.editReply({ content: `Raffle ended. ${resultText}`, components: [] }); } catch {}
        } catch (err) {
          console.error("select_end_raffle error:", err);
          try { await interaction.editReply({ content: "An error occurred while ending the raffle.", components: [] }); } catch {}
        }
        return;
      }

      return;
    }
  } catch (err) {
    console.error("interaction handler error:", err);
  }
}
