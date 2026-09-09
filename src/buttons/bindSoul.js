// src/buttons/bindSoul.js
import { raffleStore } from "../raffleStore.js";
import { buildRaffleEmbed } from "../embedBuilder.js";

export async function handleBindSoul(interaction, raffleId) {
  const userId = interaction.user.id;

  // Add entry to the ritual
  raffleStore.addEntry(raffleId, userId);

  // Fetch updated raffle
  const updated = raffleStore.findById(raffleId);

  // Rebuild embed with updated soul count
  const embed = buildRaffleEmbed(updated, updated.entries.length);

  // Update the ritual message
  try {
    const channel = await interaction.client.channels.fetch(updated.channelId);
    const msg = await channel.messages.fetch(updated.messageId);

    await msg.edit({
      embeds: [embed]
    });
  } catch (err) {
    console.error("bindSoul embed update failed:", err);
  }

  // Ritual‑themed ephemeral confirmation
  return interaction.followUp({
    content: `🔮 Your soul has been bound to the ritual.\n\n${updated.wizardPhrase}`,
    ephemeral: true
  });
}
