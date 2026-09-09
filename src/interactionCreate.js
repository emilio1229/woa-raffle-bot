// src/interactionCreate.js
import { raffleStore } from "./raffleStore.js";
import { EmbedBuilder } from "discord.js";

// Ritual button handlers
import { handleBindSoul } from "./buttons/bindSoul.js";
import { handleUnbindSoul } from "./buttons/unbindSoul.js";

/**
 * Named export required by src/index.js
 * Handles commands, buttons, and select menus.
 */
export async function handleInteraction(interaction) {
  try {
    // -----------------------------
    // CHAT INPUT COMMANDS
    // -----------------------------
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    // -----------------------------
    // BUTTON INTERACTIONS
    // -----------------------------
    if (interaction.isButton()) {
      try {
        await interaction.deferUpdate();
      } catch {
        try {
          await interaction.reply({
            content: "Processing…",
            flags: 64
          });
        } catch {}
      }

      const [action, raffleId] = interaction.customId.split("_");
      const raffle = raffleStore.findById(raffleId);

      if (!raffle) {
        try {
          await interaction.editReply({
            content: "This ritual no longer exists.",
            components: []
          });
        } catch {}
        return;
      }

      // Soul-binding ritual entry
      if (action === "enter") {
        await handleBindSoul(interaction, raffleId);
        return;
      }

      // Soul unbinding ritual exit
      if (action === "leave") {
        await handleUnbindSoul(interaction, raffleId);
        return;
      }

      return;
    }

    // -----------------------------
    // SELECT MENU INTERACTIONS
    // -----------------------------
    if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      // Manual end raffle selector
      if (customId === "select_end_raffle") {
        try { await interaction.deferUpdate(); } catch {}

        const selected = interaction.values && interaction.values[0];
        if (!selected) return;

        const raffle = raffleStore.findById(selected);
        if (!raffle) {
          try {
            await interaction.editReply({
              content: "Selected ritual not found.",
              components: []
            });
          } catch {}
          return;
        }

        try {
          raffleStore.markEnded(raffle.id);
          const updated = raffleStore.findById(raffle.id);
          const entries = updated.entries ?? [];

          let resultText;
          let winner = null;

          if (entries.length === 0) {
            resultText = "💀 No souls were bound — the ritual yields no winner.";
          } else {
            winner = entries[Math.floor(Math.random() * entries.length)];
            resultText = `🔮 The ritual has chosen: <@${winner}>`;
          }

          // Build ritual ending embed
          const endingEmbed = new EmbedBuilder()
            .setTitle("🔮 THE RITUAL CONCLUDES 🔮")
            .setDescription(
              `${updated.wizardPhrase}\n\n` +
              (winner
                ? `By ancient decree, **<@${winner}>** is chosen.\n\nThe circle falls silent…`
                : `The sigils fade — no essence was found worthy.\n\nThe circle grows quiet…`)
            )
            .setColor(0x4B0082);

          // Update original raffle message
          try {
            const channel = await interaction.client.channels.fetch(updated.channelId);
            const msg = await channel.messages.fetch(updated.messageId);
            await msg.edit({ embeds: [endingEmbed], components: [] });
          } catch {}

          // Update admin reply
          try {
            await interaction.editReply({
              content: resultText,
              components: []
            });
          } catch {}

        } catch (err) {
          console.error("select_end_raffle error:", err);
          try {
            await interaction.editReply({
              content: "An error occurred while ending the ritual.",
              components: []
            });
          } catch {}
        }

        return;
      }

      return;
    }
  } catch (err) {
    console.error("interaction handler error:", err);
  }
}
