import { EmbedBuilder } from "discord.js";
import { buildActiveRaffleEmbed } from "../embedBuilder.js";
import { countEntriesForUser, removeManualEntry, cloneEntries } from "../raffleEntries.js";
import { withRaffleEntryLock } from "../raffleEntryLock.js";
import { raffleStore } from "../raffleStore.js";

export async function handleUnbindSoul(interaction, raffleId) {
  return withRaffleEntryLock(raffleId, async () => {
    const raffle = raffleStore.getById(raffleId);
    if (!raffle) {
      return interaction.reply({
        content: "❌ This ritual has already ended.",
        flags: 64
      });
    }

    const userId = interaction.user.id;
    raffle.boundUsers ??= [];
    raffle.entries ??= [];

    if (!raffle.boundUsers.includes(userId)) {
      return interaction.reply({
        content: "✨ You have no manually offered sigil to reclaim from this ritual.",
        flags: 64
      });
    }

    const originalEntries = cloneEntries(raffle.entries);
    const originalBoundUsers = [...raffle.boundUsers];
    const removal = removeManualEntry(raffle.entries, userId);

    if (!removal.removed) {
      return interaction.reply({
        content: "❌ Your manual sigil entry could not be located in this ritual.",
        flags: 64
      });
    }

    raffle.boundUsers = raffle.boundUsers.filter(id => id !== userId);
    raffle.entries = removal.entries;

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
      raffle.boundUsers = originalBoundUsers;

      return interaction.reply({
        content: "❌ The ritual could not be updated. Your sigil was not reclaimed.",
        flags: 64
      });
    }

    raffleStore.save(raffle);

    const glow = ["🜂🌑", "🜂🕯️", "🜂🌫️", "🜂⚫"];
    const glowSymbol = glow[Math.floor(Math.random() * glow.length)];

    const embed = new EmbedBuilder()
      .setTitle(`${glowSymbol} Sigil Reclaimed`)
      .setDescription(
        [
          `Your essence withdraws from the ritual circle.`,
          `The sigils dim as your offering fades.`,
          ``,
          `🜂 **Your Remaining Entries:** ${countEntriesForUser(raffle.entries, userId)}`,
          `💠 **Total Sigils Bound:** ${raffle.entries.length}`,
          ``,
          `⟐ The astral ledger adjusts to your departure.`
        ].join("\n")
      )
      .setColor(0x2E003E)
      .setFooter({ text: "The ritual shifts…" });

    return interaction.reply({
      embeds: [embed],
      flags: 64
    });
  });
}
