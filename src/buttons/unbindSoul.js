// src/buttons/unbindSoul.js
import { raffleStore } from "../raffleStore.js";
import { EmbedBuilder } from "discord.js";

export async function handleUnbindSoul(interaction, raffleId) {
  const raffle = raffleStore.getById(raffleId);
  if (!raffle) {
    return interaction.reply({
      content: "❌ This ritual has already ended.",
      flags: 64
    });
  }

  const userId = interaction.user.id;

  if (!raffle.entries.includes(userId)) {
    return interaction.reply({
      content: "✨ Your soul is not bound to this ritual.",
      flags: 64
    });
  }

  raffle.entries = raffle.entries.filter(id => id !== userId);
  raffleStore.save(raffle);

  const glow = ["💀🌑", "💀🕯️", "💀🌫️", "💀⚫"];
  const glowSymbol = glow[Math.floor(Math.random() * glow.length)];

  const embed = new EmbedBuilder()
    .setTitle(`${glowSymbol} Soul Withdrawn`)
    .setDescription(
      [
        `Your essence slips free from the ritual circle.`,
        `The sigils dim slightly as your presence fades.`,
        ``,
        `💀 **Soul Released**`,
        `🩸 **Remaining Souls:** ${raffle.entries.length}`,
        ``,
        `⟐ The astral ledger adjusts, noting your departure.`
      ].join("\n")
    )
    .setColor(0x2E003E)
    .setFooter({ text: "The ritual shifts…" });

  try {
    const channel = await interaction.client.channels.fetch(raffle.channelId);
    const msg = await channel.messages.fetch(raffle.messageId);

    const updatedEmbed = new EmbedBuilder()
      .setTitle(`🔮 ${raffle.name}`)
      .setColor(0x4B0082)
      .setDescription(
        [
          `A ritual has been cast. The circle hums with quiet power.`,
          ``,
          `**✨ Invocation**`,
          `⟐ ${raffle.invocationText}`,
          ``,
          `**🎁 Prize**`,
          `${raffle.prize}`,
          ``,
          `**⏳ Ends At**`,
          `<t:${Math.floor(raffle.endsAt / 1000)}:F>`,
          ``,
          `**🩸 Bound Souls**`,
          `${raffle.entries.length}`
        ].join("\n")
      );

    await msg.edit({
      embeds: [updatedEmbed],
      components: msg.components
    });
  } catch (err) {
    console.error("unbindSoul embed update failed:", err);
  }

  return interaction.reply({
    embeds: [embed],
    flags: 64
  });
}
