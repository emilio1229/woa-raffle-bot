// src/buttons/bindSoul.js
import { raffleStore } from "../raffleStore.js";
import { EmbedBuilder } from "discord.js";

export async function handleBindSoul(interaction, raffleId) {
  const raffle = raffleStore.getById(raffleId);
  if (!raffle) {
    return interaction.reply({
      content: "❌ This ritual has already ended.",
      ephemeral: true
    });
  }

  const userId = interaction.user.id;

  // Prevent double-binding
  if (raffle.entries.includes(userId)) {
    return interaction.reply({
      content: "✨ Your soul is **already bound** to this ritual.",
      ephemeral: true
    });
  }

  // Add soul
  raffle.entries.push(userId);

  // Arcane glow animation (simulated)
  const glow = [
    "🔮✨",
    "🔮💫",
    "🔮🌌",
    "🔮⚡"
  ];

  const embed = new EmbedBuilder()
    .setTitle(`${glow[Math.floor(Math.random() * glow.length)]} Soul Bound`)
    .setDescription(
      `Your essence has been **woven into the ritual circle**.\n\n` +
      `🩸 **Bound Souls:** ${raffle.entries.length}`
    )
    .setColor(0x4B0082);

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
    console.error("bindSoul embed update failed:", err);
  }

  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
