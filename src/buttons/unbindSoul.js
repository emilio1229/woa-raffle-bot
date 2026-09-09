// src/buttons/unbindSoul.js
import { raffleStore } from "../raffleStore.js";
import { EmbedBuilder } from "discord.js";

export async function handleUnbindSoul(interaction, raffleId) {
  const raffle = raffleStore.getById(raffleId);
  if (!raffle) {
    return interaction.reply({
      content: "❌ This ritual has already ended.",
      ephemeral: true
    });
  }

  const userId = interaction.user.id;

  // Prevent unbinding if not bound
  if (!raffle.entries.includes(userId)) {
    return interaction.reply({
      content: "✨ Your soul is **not bound** to this ritual.",
      ephemeral: true
    });
  }

  // Remove soul
  raffle.entries = raffle.entries.filter(id => id !== userId);

  // Arcane glow animation (dark variant)
  const glow = [
    "💀🌑",
    "💀🕯️",
    "💀🌫️",
    "💀⚫"
  ];

  const embed = new EmbedBuilder()
    .setTitle(`${glow[Math.floor(Math.random() * glow.length)]} Soul Withdrawn`)
    .setDescription(
      `Your essence has been **released from the ritual circle**.\n\n` +
      `🩸 **Bound Souls:** ${raffle.entries.length}`
    )
    .setColor(0x2E003E);

  // Update main raffle embed
  try {
    const channel = await interaction.client.channels.fetch(raffle.channelId);
    const msg = await channel.messages.fetch(raffle.messageId);

    const updatedEmbed = new EmbedBuilder()
      .setTitle(`🎉 Raffle: ${raffle.prize} 🎉`)
      .addFields(
        { name: "Prize", value: raffle.prize, inline: true },
        { name: "Ends At", value: `<t:${Math.floor(raffle.endsAt / 1000)}:F>`, inline: true },
        { name: "Invocation", value: raffle.wizardPhrase },
        { name: "Bound Souls", value: `${raffle.entries.length}`, inline: true }
      )
      .setColor(0x4B0082);

    await msg.edit({ embeds: [updatedEmbed], components: msg.components });
  } catch (err) {
    console.error("unbindSoul embed update failed:", err);
  }

  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
