import { EmbedBuilder } from "discord.js";
import { buildActiveRaffleEmbed } from "../embedBuilder.js";
import { withRaffleEntryLock } from "../raffleEntryLock.js";
import { raffleStore } from "../raffleStore.js";

function removeSingleEntry(entries, userId) {
  const index = entries.indexOf(userId);
  if (index !== -1) {
    entries.splice(index, 1);
  }
}

function countEntriesForUser(entries, userId) {
  return entries.filter(id => id === userId).length;
}

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
        content: "⚫ You are not part of this ritual.",
        flags: 64
      });
    }

    const originalEntries = [...raffle.entries];
    const originalBoundUsers = [...raffle.boundUsers];

    raffle.boundUsers = raffle.boundUsers.filter(id => id !== userId);
    removeSingleEntry(raffle.entries, userId);

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
        content: "❌ The ritual could not be updated. You remain within the circle.",
        flags: 64
      });
    }

    raffleStore.save(raffle);

    const glow = ["⚫🌑", "⚫🕯️", "⚫🌫️", "⚫🜂"];
    const glowSymbol = glow[Math.floor(Math.random() * glow.length)];

    const embed = new EmbedBuilder()
      .setTitle(`${glowSymbol} Ritual Left`)
      .setDescription(
        [
          `You step away from the ritual circle.`,
          `The energies dim as your presence fades.`,
          ``,
          `🜂 **Your Remaining Entries:** ${countEntriesForUser(raffle.entries, userId)}`,
          `💠 **Total Participants:** ${raffle.entries.length}`,
          ``,
          `⟐ The ritual shifts with your departure.`
        ].join("\n")
      )
      .setColor(0x2E003E)
      .setFooter({ text: "The ritual calms…" });

    return interaction.reply({
      embeds: [embed],
      flags: 64
    });
  });
}
