// src/buttons/bindSoul.js
import { raffleStore } from "../raffleStore.js";
import { buildRaffleEmbed } from "../embedBuilder.js";

export async function handleBindSoul(interaction, raffleId) {
  const userId = interaction.user.id;

  // Add entry
  raffleStore.addEntry(raffleId, userId);

  // Rebuild embed
  const updated = raffleStore.findById(raffleId);
  const embed = buildRaffleEmbed(updated, updated.entries.length);

  // Update message
  try {
    const channel = await interaction.client.channels.fetch(updated.channelId);
    const msg = await channel.messages.fetch(updated.messageId);
    await msg.edit({ embeds: [embed] });
  } catch (err) {
    console.error("bindSoul embed update failed:", err);
  }

  // Ephemeral confirmation
  return interaction.followUp({
    content: "Your soul has been bound to this raffle.",
    ephemeral: true
  });
}
