import { raffleStore } from "../raffleStore.js";
import { buildRaffleEmbed } from "../embedBuilder.js";
import { buildRaffleButtons } from "../components.js";

export async function handleUnbindSoul(interaction, raffleId) {
  const raffle = raffleStore.findById(raffleId);
  if (!raffle || raffle.ended) {
    return interaction.reply({
      content: "That ritual has ended or no longer exists.",
      ephemeral: true
    });
  }

  const removed = raffleStore.removeEntry(raffleId, interaction.user.id);
  if (!removed) {
    return interaction.reply({
      content: "Your soul was not bound to this ritual.",
      ephemeral: true
    });
  }

  const embed = buildRaffleEmbed(raffle, raffle.entries.length);
  const buttons = buildRaffleButtons(raffle.id);

  try {
    const channel = await interaction.client.channels.fetch(raffle.channelId);
    const message = await channel.messages.fetch(raffle.messageId);

    await message.edit({
      embeds: [embed],
      components: [buttons]
    });
  } catch (err) {
    console.error("Failed to update ritual message:", err);
  }

  return interaction.followUp({
    content: "🚪 Your soul has been withdrawn from the ritual.",
    ephemeral: true
  });
}

