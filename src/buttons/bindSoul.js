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
      content: "✨ Your essence is already offered to this ritual.",
      flags: 64
    });
  }

  raffle.entries.push(userId);
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
        `💠 **Sigil Offered**`,
        `💠 **Total Sigils:** ${raffle.entries.length}`,
        ``,
        `⟐ The astral ledger marks your contribution.`
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
          `**💠 Bound Sigils**`,
          `${raffle.entries.length}`
        ].join("\n")
      )
      .setImage("attachment://woa_ritual_bg.png");

    await msg.edit({
      embeds: [updatedEmbed],
      components: msg.components,
      files: ["./assets/woa_ritual_bg.png"]
    });
  } catch (err) {
    console.error("bindSoul embed update failed:", err);
  }

  return interaction.reply({
    embeds: [embed],
    flags: 64
  });
}
