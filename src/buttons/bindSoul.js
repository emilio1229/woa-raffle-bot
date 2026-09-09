// src/buttons/bindSoul.js
import { raffleStore } from "../raffleStore.js";
import { EmbedBuilder } from "discord.js";

export async function handleBindSoul(interaction, raffleId) {
  const raffle = raffleStore.getById(raffleId);
  if (!raffle) {
    return interaction.reply({
      content: "❌ This ritual has already ended.",
      flags: 64
    });
  }

  const userId = interaction.user.id;

  if (raffle.entries.includes(userId)) {
    return interaction.reply({
      content: "✨ Your soul is already bound to this ritual.",
      flags: 64
    });
  }

  raffle.entries.push(userId);
  raffleStore.save(raffle);

  const glow = ["🔮✨", "🔮💫", "🔮🌌", "🔮⚡"];
  const glowSymbol = glow[Math.floor(Math.random() * glow.length)];

  const embed = new EmbedBuilder()
    .setTitle(`${glowSymbol} Essence Convergence`)
    .setDescription(
      [
        `The ley‑threads shimmer as your essence enters the circle.`,
        `A faint hum echoes — the ritual acknowledges your presence.`,
        ``,
        `🔮 **Arcane Binding Complete**`,
        `🩸 **Souls Intertwined:** ${raffle.entries.length}`,
        ``,
        `⟐ The sigils flare briefly, marking your arrival in the astral ledger.`
      ].join("\n")
    )
    .setColor(0x5A00A0)
    .setFooter({ text: "The ritual deepens…" });

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
    console.error("bindSoul embed update failed:", err);
  }

  return interaction.reply({
    embeds: [embed],
    flags: 64
  });
}
