// src/commands/raffle/raffle-end.js
import { SlashCommandBuilder } from "discord.js";
import { raffleStore } from "../../raffleStore.js";
import { buildRaffleEmbed } from "../../embedBuilder.js";

export default {
  data: new SlashCommandBuilder()
    .setName("raffle-end")
    .setDescription("Manually complete an active ritual raffle."),

  async execute(interaction) {
    const active = raffleStore.getActive();

    if (!active) {
      return interaction.reply({
        content: "💀 No active ritual exists.",
        ephemeral: true
      });
    }

    // End the ritual
    raffleStore.markEnded(active.id);

    const updated = raffleStore.findById(active.id);
    const entries = updated.entries ?? [];

    let winner = null;
    let resultText;

    if (entries.length === 0) {
      resultText = "💀 No souls were bound — the ritual yields no winner.";
    } else {
      winner = entries[Math.floor(Math.random() * entries.length)];
      resultText = `🔮 The ritual has chosen: <@${winner}>`;
    }

    const endingEmbed = buildRaffleEmbed(updated, entries.length, winner);

    // Update the original ritual message
    try {
      const channel = await interaction.client.channels.fetch(updated.channelId);
      const msg = await channel.messages.fetch(updated.messageId);
      await msg.edit({ embeds: [endingEmbed], components: [] });
    } catch (err) {
      console.error("raffle-end message update failed:", err);
    }

    return interaction.reply({
      content: resultText,
      ephemeral: true
    });
  }
};
