import { EmbedBuilder } from "discord.js";
import { buildActiveRaffleEmbed } from "../embedBuilder.js";
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

  raffle.boundUsers = raffle.boundUsers.filter(id => id !== userId);
  removeSingleEntry(raffle.entries, userId);
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

  try {
    const channel = await interaction.client.channels.fetch(raffle.channelId);
    const msg = await channel.messages.fetch(raffle.messageId);

    await msg.edit({
      embeds: [buildActiveRaffleEmbed(raffle)],
      components: msg.components,
      files: ["./assets/woa_ritual_bg.png"]
    });
  } catch (err) {
    console.error("unbindSoul embed update failed:", err);
  }

  return interaction.reply({
    embeds: [embed],
    flags: 64
  });
}
