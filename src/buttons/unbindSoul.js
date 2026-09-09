// src/buttons/unbindSoul.js
import { raffleStore } from "../raffleStore.js";
import { buildRaffleEmbed } from "../embedBuilder.js";

export async function handleUnbindSoul(interaction, raffleId) {
  const userId = interaction.user.id;

  // Remove entry
  raffleStore.removeEntry(raffleId, userId);

  // Rebuild embed
  const updated = raffleStore.findById(raffleId);
  const embed = buildRaffleEmbed(updated, updated.entries.length);

  // Update message
  try {
    const channel = await interaction.client.channels.fetch(updated.channelId);
    const msg = await channel.messages.fetch(updated.messageId);
    await msg.edit({ embeds: [embed] });
  } catch (err) {
    console.error("unbindSoul embed update failed:", err);
  }

  // Ephemeral confirmation
  return interaction.followUp({
    content: "🚨Your soul has been released from this raffle.🚷",
    ephemeral: true
  });
}
