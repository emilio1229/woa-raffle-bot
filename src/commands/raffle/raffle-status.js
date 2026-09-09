// src/commands/raffle/raffle-status.js
import { SlashCommandBuilder } from "discord.js";
import { raffleStore } from "../../raffleStore.js";
import { buildRaffleEmbed } from "../../embedBuilder.js";

export default {
  data: new SlashCommandBuilder()
    .setName("raffle-status")
    .setDescription("View the current ritual raffle status."),

  async execute(interaction) {
    const active = raffleStore.getActive();

    if (!active) {
      return interaction.reply({
        content: "💀 No active ritual exists.",
        ephemeral: true
      });
    }

    const embed = buildRaffleEmbed(active, active.entries.length);

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
