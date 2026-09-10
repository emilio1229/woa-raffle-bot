import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { raffleStore } from "../../raffleStore.js";

export default {
  data: new SlashCommandBuilder()
    .setName("raffle-status")
    .setDescription("Show the current ritual raffle status."),

  async execute(interaction) {
    const allRaffles = raffleStore.all().filter(r => r.ready && !r.ended && !r.ending && Date.now() < r.endsAt);

    if (allRaffles.length === 0) {
      return interaction.reply({
        content: "❌ There are no active rituals at the moment.",
        ephemeral: true
      });
    }

    if (allRaffles.length === 1) {
      const raffle = allRaffles[0];
      const embed = new EmbedBuilder()
        .setTitle("🔮 Active Ritual Status")
        .addFields(
          { name: "Prize", value: raffle.prize || "Unknown", inline: true },
          { name: "Ends At", value: `<t:${Math.floor(raffle.endsAt / 1000)}:F>`, inline: true },
          { name: "Invocation", value: raffle.invocationText || "The sigils await...", inline: false },
          { name: "💠 Bound Sigils", value: `${raffle.entries.length}`, inline: true }
        )
        .setColor(0x4B0082);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Multiple raffles - show dropdown
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_status_raffle")
      .setPlaceholder("Select a ritual to view status");

    allRaffles.forEach(r => {
      selectMenu.addOptions({
        label: r.name || `Raffle ${r.id}`,
        value: r.id,
        description: `Prize: ${r.prize}`
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return interaction.reply({
      content: "Choose a ritual to view:",
      components: [row],
      ephemeral: true
    });
  }
};
