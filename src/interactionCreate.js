// src/interactionCreate.js
import { raffleStore } from "./raffleStore.js";
import { buildRaffleEndedEmbed } from "./embedBuilder.js";
import { EmbedBuilder, AttachmentBuilder } from "discord.js";

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
      const raffle = raffleStore.getById(raffleId);

      if (!raffle) {
        try {
          await interaction.editReply({
            content: "This ritual no longer exists.",
            components: []
          });
        } catch {}
        return;
      }

      if (action === "bindSoul") {
        await handleBindSoul(interaction, raffleId);
        return;
      }

      if (action === "unbindSoul") {
        await handleUnbindSoul(interaction, raffleId);
        return;
      }

      return;
    }

    // ---------------------------------------------------------
    // STRING SELECT MENUS
    // ---------------------------------------------------------
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      // Status raffle selection
      if (customId === "select_status_raffle") {
        try {
          await interaction.deferUpdate();
        } catch {}

        const selectedId = interaction.values[0];
        const raffle = raffleStore.getById(selectedId);

        if (!raffle) {
          try {
            await interaction.editReply({
              content: "Selected ritual not found.",
              components: []
            });
          } catch {}
          return;
        }

        const { EmbedBuilder } = require("discord.js");
        const embed = new EmbedBuilder()
          .setTitle("🔮 Active Ritual Status")
          .addFields(
            { name: "Prize", value: raffle.prize || "Unknown", inline: true },
            { name: "Ends At", value: `<t:${Math.floor(raffle.endsAt / 1000)}:F>`, inline: true },
            { name: "Invocation", value: raffle.invocationText || "The sigils await...", inline: false },
            { name: "Bound Souls", value: `${raffle.entries.length}`, inline: true }
          )
          .setColor(0x4B0082);

        try {
          await interaction.editReply({
            content: "",
            embeds: [embed],
            components: []
          });
        } catch {}

        return;
      }

      // End raffle selection
      if (customId === "select_end_raffle") {
        try {
          await interaction.deferUpdate();
        } catch {}

        const selectedId = interaction.values[0];
        const raffle = raffleStore.getById(selectedId);

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
          const updated = raffleStore.getById(raffle.id);
          const entries = updated.entries ?? [];

          let winner = null;
          if (entries.length > 0) {
            winner = entries[Math.floor(Math.random() * entries.length)];
          }

          const glow = ["🔮✨", "🔮💫", "🔮🌌", "🔮⚡"];

          const embed = new EmbedBuilder()
            .setTitle(`${glow[Math.floor(Math.random() * glow.length)]} Ritual Concluded`)
            .setDescription(
              winner
                ? `The arcane forces have chosen <@${winner}>.\n\n**Prize:** ${updated.prize}`
                : `💀 The ritual found **no souls** to bind.\n\nNo winner was chosen.`
            )
            .addFields(
              { name: "Prize", value: updated.prize || "Unknown", inline: true },
              { name: "Invocation", value: updated.invocationText || "The sigils await...", inline: false },
              { name: "Bound Souls", value: `${entries.length}`, inline: true }
            )
            .setColor(0x4B0082);

          try {
            const channel = await interaction.client.channels.fetch(updated.channelId);
            const msg = await channel.messages.fetch(updated.messageId);
            await msg.edit({ embeds: [embed], components: [] });
          } catch {}

          // Send grand winner announcement
          if (winner) {
            try {
              const channel = await interaction.client.channels.fetch(updated.channelId);
              const winnerTag = `<@${winner}>`;
              const roleTag = updated.tagRole ? ` <@&${updated.tagRole}>` : "";

              const grandEmbed = new EmbedBuilder()
                .setColor(0xFF4500)
                .setTitle("✨ A Champion Has Been Chosen ✨")
                .setDescription(
                  `The sigil storm erupts in violent cosmic fury.\n\n🔮 **Winner:** ${winnerTag}${roleTag}`
                )
                .addFields(
                  { name: "🎁 Prize", value: `**${updated.prize}**`, inline: false },
                  { name: "📜 Souls Bound", value: `${entries.length}`, inline: true }
                )
                .setImage("attachment://woa_winner_bg.png")
                .setFooter({ text: "Wizards of Ark • Ascension Complete" })
                .setTimestamp();

              const attachment = new AttachmentBuilder("./assets/woa_winner_bg.png", { name: "woa_winner_bg.png" });

              await channel.send({
                embeds: [grandEmbed],
                files: [attachment],
                allowedMentions: { roles: updated.tagRole ? [updated.tagRole] : [] }
              });
            } catch (err) {
              console.error("Grand announcement failed:", err);
            }
          }

          try {
            await interaction.editReply({
              content: "🔮 The ritual has been ended.",
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
