import { EmbedBuilder } from "discord.js";
import { buildActiveRaffleEmbed } from "../embedBuilder.js";
import { countEntriesForUser, createManualEntry, cloneEntries } from "../raffleEntries.js";
import { withRaffleEntryLock } from "../raffleEntryLock.js";
import { raffleStore } from "../raffleStore.js";

export async function handleBindSoul(interaction, raffleId) {
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

    if (raffle.boundUsers.includes(userId)) {
      return interaction.reply({
        content: "✨ Your essence is already offered to this ritual.",
        flags: 64
      });
    }

    const originalEntries = cloneEntries(raffle.entries);
    const originalBoundUsers = [...raffle.boundUsers];

    raffle.boundUsers.push(userId);
    raffle.entries.push(createManualEntry(userId));

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
        content: "❌ The ritual could not be updated. Your sigil was not added.",
        flags: 64
      });
    }

    raffleStore.save(raffle);

    const glow = ["🔮✨", "🔮💫", "🔮🌌", "🔮⚡"];
    const glowSymbol = glow[Math.floor(Math.random() * glow.length)];

    const embed = new EmbedBuilder()
      .setTitle(`${glowSymbol} Sigil Offered`)
      .setDescription(
        [
          `Your essence merges with the ritual circle.`,
          `The sigils flare as your offering is accepted.`,
          ``,
          `💠 **Your Total Entries:** ${countEntriesForUser(raffle.entries, userId)}`,
          `💠 **Total Sigils Bound:** ${raffle.entries.length}`,
          ``,
          `⟐ The astral ledger marks your contribution.`
        ].join("\n")
      )
      .setColor(0x5A00A0)
      .setFooter({ text: "The ritual deepens…" });

    return interaction.reply({
      embeds: [embed],
      flags: 64
    });
  });
}
