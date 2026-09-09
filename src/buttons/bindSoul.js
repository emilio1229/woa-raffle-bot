import { raffleStore } from "../raffleStore.js";
import { buildRaffleEmbed } from "../embedBuilder.js";
import { buildRaffleButtons } from "../components.js";

export async function handleBindSoul(interaction, raffleId) {
  const raffle = raffleStore.findById(raffleId);
  if (!raffle || raffle.ended) {
    return interaction.reply({
      content: "That ritual has ended or no longer exists.",
      ephemeral: true
    });
  }

  const added = raffleStore.addEntry(raffleId, interaction.user.id);
  if (!added) {
    return interaction.reply({
      content: "Your soul is already bound to this ritual.",
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
    content: "🩸 Your soul has been offered to the ritual.",
    ephemeral: true
  });
}

