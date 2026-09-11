import { EmbedBuilder } from "discord.js";
import { buildActiveRaffleEmbed } from "../embedBuilder.js";
import { withRaffleEntryLock } from "../raffleEntryLock.js";
import { raffleStore } from "../raffleStore.js";

function countEntriesForUser(entries, userId) {
  return entries.filter(id => id === userId).length;
}

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

    // Already offered sigils
    if (raffle.boundUsers.includes(userId)) {
      return interaction.reply({
        content: "✨ You have already **offered your sigils** to this ritual.",
        flags: 64
      });
    }

    const originalEntries = [...raffle.entries];
    const originalBoundUsers = [...raffle.boundUsers];

    // Offer sigils (enter)
    raffle.boundUsers.push(userId);
    raffle.entries.push(userId);

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
        content: "❌ The ritual could not be updated. Your sigils were **not** offered.",
        flags: 64
      });
    }

    raffleStore.save(raffle);

    const glow = ["🔮✨", "🔮💫", "🔮🌌", "🔮⚡"];
    const glowSymbol = glow[Math.floor(Math.random() * glow.length)];

    const embed = new EmbedBuilder()
      .setTitle(`${glowSymbol} Sigils Offered`)
      .setDescription(
        [
          `Your stored sigils surge into the ritual circle.`,
          `The arcane ledger acknowledges your offering.`,
          ``,
          `💠 **Your Total Entries:** ${countEntriesForUser(raffle.entries, userId)}`,
          `💠 **Total Sigils Offered:** ${raffle.entries.length}`,
          ``,
          `⟐ The ritual deepens with your contribution.`
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
