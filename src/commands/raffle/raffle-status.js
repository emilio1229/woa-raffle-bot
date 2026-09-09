import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { raffleStore } from "../../raffleStore.js";

export default {
  data: new SlashCommandBuilder()
    .setName("raffle-status")
    .setDescription("Show the current ritual raffle status."),

  async execute(interaction) {
    const raffle = raffleStore.getActive(interaction.guild.id);

    if (!raffle) {
      return interaction.reply({
        content: "❌ There is no active ritual at the moment.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🔮 Active Ritual Status")
      .addFields(
        { name: "Prize", value: raffle.prize, inline: true },
        { name: "Ends At", value: `<t:${Math.floor(raffle.endsAt / 1000)}:F>`, inline: true },
        { name: "Invocation", value: raffle.wizardPhrase },
        { name: "Bound Souls", value: `${raffle.entries.length}`, inline: true }
      )
      .setColor(0x4B0082);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
