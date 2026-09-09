// src/interactionCreate.js
import { raffleStore } from "./raffleStore.js";
import { buildRaffleEmbed } from "./embedBuilder.js";

// Ritual button handlers
import { handleBindSoul } from "./buttons/bindSoul.js";
import { handleUnbindSoul } from "./buttons/unbindSoul.js";

/**
 * Unified interaction handler for:
 * - Slash commands
 * - Buttons
 * - String select menus
 * - Role select menus
 */
export async function handleInteraction(interaction) {
  try {
    // ---------------------------------------------------------
    // SLASH COMMANDS
    // ---------------------------------------------------------
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
      return;
    }

    // ---------------------------------------------------------
    // BUTTONS
    // ---------------------------------------------------------
    if (interaction.isButton()) {
      try {
        await interaction.deferUpdate();
      } catch {
        try {
          await interaction.reply({ content: "Processing…", flags: 64 });
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

    // ---------------------------------------------------------
    // STRING SELECT MENUS
    // (Used for manual end raffle)
    // ---------------------------------------------------------
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      if (customId === "select_end_raffle") {
        try { await interaction.deferUpdate(); } catch {}

        const selected = interaction.values[0];
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

          let winner = null;
          let resultText;

          if (entries.length === 0) {
            resultText = "💀 No souls were bound — the ritual yields no winner.";
          } else {
            winner = entries[Math.floor(Math.random() * entries.length)];
            resultText = `🔮 The ritual has chosen: <@${winner}>`;
          }

          const endingEmbed = buildRaffleEmbed(updated, updated.entries.length, winner);

          try {
            const channel = await interaction.client.channels.fetch(updated.channelId);
            const msg = await channel.messages.fetch(updated.messageId);
            await msg.edit({ embeds: [endingEmbed], components: [] });
          } catch {}

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

    // ---------------------------------------------------------
    // ROLE SELECT MENUS
    // (Used by raffle-start.js)
    // ---------------------------------------------------------
    if (interaction.isRoleSelectMenu()) {
      // DO NOT handle logic here — raffle-start.js uses awaitMessageComponent()
      // We ONLY acknowledge the interaction so Discord doesn't timeout.
      try {
        await interaction.deferUpdate();
      } catch {}

      return;
    }

  } catch (err) {
    console.error("interaction handler error:", err);
  }
}
