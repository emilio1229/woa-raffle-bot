// src/interactionCreate.js
import { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { buildActiveRaffleEmbed } from "./embedBuilder.js";
import { cloneEntries, createRedeemedEntries } from "./raffleEntries.js";
import { concludeRaffle } from "./raffleLifecycle.js";
import { withRaffleEntryLock } from "./raffleEntryLock.js";
import { raffleStore } from "./raffleStore.js";
import { sigilStore } from "./sigilStore.js";
import { buildRedeemSuccessEmbed } from "./sigilUtils.js";

import { handleBindSoul } from "./buttons/bindSoul.js";
import { handleUnbindSoul } from "./buttons/unbindSoul.js";

function getRaffleIdFromButton(interaction) {
  if (interaction.customId === "bindSoul" || interaction.customId === "unbindSoul") {
    return raffleStore.getIdByMessage(interaction.message?.id);
  }

  if (interaction.customId.startsWith("bindSoul_")) {
    return interaction.customId.slice("bindSoul_".length);
  }

  if (interaction.customId.startsWith("unbindSoul_")) {
    return interaction.customId.slice("unbindSoul_".length);
  }

  return null;
}

export async function handleInteraction(interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === "sigil_shop_open") {
        const modal = new ModalBuilder()
          .setCustomId("sigil_redeem_modal")
          .setTitle("Redeem Sigils for Raffle Entries");

        const raffleIdInput = new TextInputBuilder()
          .setCustomId("sigil_raffle_id")
          .setLabel("Raffle ID")
          .setPlaceholder("Paste the raffle ID from /sigil-shop")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const entryCountInput = new TextInputBuilder()
          .setCustomId("sigil_entry_count")
          .setLabel("How many raffle entries?")
          .setPlaceholder("1")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(raffleIdInput),
          new ActionRowBuilder().addComponents(entryCountInput)
        );

        await interaction.showModal(modal);
        return;
      }

      const raffleId = getRaffleIdFromButton(interaction);
      const raffle = raffleId ? raffleStore.getById(raffleId) : null;

      if ((interaction.customId === "bindSoul" || interaction.customId.startsWith("bindSoul_")) && raffle) {
        await handleBindSoul(interaction, raffleId);
        return;
      }

      if ((interaction.customId === "unbindSoul" || interaction.customId.startsWith("unbindSoul_")) && raffle) {
        await handleUnbindSoul(interaction, raffleId);
        return;
      }

      if (interaction.customId === "bindSoul" || interaction.customId === "unbindSoul") {
        await interaction.reply({
          content: "❌ This ritual is no longer active.",
          flags: 64
        });
      }

      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === "sigil_redeem_modal") {
      if (!interaction.inGuild() || !interaction.guild) {
        await interaction.reply({
          content: "❌ Sigil redemption can only be used inside a server raffle channel.",
          flags: 64
        });
        return;
      }

      await interaction.deferReply({ flags: 64 });

      const raffleId = interaction.fields.getTextInputValue("sigil_raffle_id").trim();
      const entryCountRaw = interaction.fields.getTextInputValue("sigil_entry_count").trim();
      const entryCount = Number.parseInt(entryCountRaw, 10);

      if (!Number.isInteger(entryCount) || entryCount <= 0) {
        await interaction.editReply({ content: "❌ Enter a valid positive number of raffle entries." });
        return;
      }

      try {
        await withRaffleEntryLock(raffleId, async () => {
          const raffle = raffleStore.getById(raffleId);

          if (!raffle || raffle.guildId !== interaction.guild.id || raffle.ended || Date.now() >= raffle.endsAt) {
            await interaction.editReply({ content: "❌ That raffle is not active right now." });
            return;
          }

          const originalEntries = cloneEntries(raffle.entries ?? []);
          let redemption;

          try {
            redemption = sigilStore.redeem(
              interaction.guild.id,
              interaction.user.id,
              entryCount,
              raffle.id,
              raffle.name
            );
          } catch (err) {
            throw err;
          }

          raffle.entries = [
            ...originalEntries,
            ...createRedeemedEntries(interaction.user.id, entryCount, redemption.transaction.id)
          ];

          try {
            const channel = await interaction.client.channels.fetch(raffle.channelId);
            const msg = await channel.messages.fetch(raffle.messageId);
            await msg.edit({
              embeds: [buildActiveRaffleEmbed(raffle)],
              components: msg.components,
              files: ["./assets/woa_ritual_bg.png"]
            });
          } catch (err) {
            raffle.entries = originalEntries;
            sigilStore.rollbackTransaction(interaction.guild.id, interaction.user.id, redemption.transaction.id);
            throw new Error("The ritual display could not be updated. Your sigils were not spent.");
          }

          raffleStore.save(raffle);

          await interaction.editReply({
            embeds: [buildRedeemSuccessEmbed(raffle, entryCount, redemption.sigilCost, redemption.user.balance)]
          });
        });
      } catch (err) {
        await interaction.editReply({
          content: `❌ ${err.message}`
        });
      }

      return;
    }

    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

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

        const embed = new EmbedBuilder()
          .setTitle("🔮 Active Ritual Status")
          .addFields(
            { name: "Prize", value: raffle.prize || "Unknown", inline: true },
            { name: "Ends At", value: `<t:${Math.floor(raffle.endsAt / 1000)}:F>`, inline: true },
            { name: "Invocation", value: raffle.invocationText || "The sigils await...", inline: false },
            { name: "Bound Souls", value: `${(raffle.entries ?? []).length}`, inline: true }
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

      if (customId === "select_end_raffle") {
        try {
          await interaction.deferUpdate();
        } catch {}

        const selectedId = interaction.values[0];

        try {
          const result = await concludeRaffle(interaction.client, selectedId);

          if (result.status === "missing") {
            await interaction.editReply({
              content: "Selected ritual not found.",
              components: []
            });
            return;
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

    if (interaction.isRoleSelectMenu()) {
      try {
        await interaction.deferUpdate();
      } catch {}

      return;
    }
  } catch (err) {
    console.error("interaction handler error:", err);
  }
}
