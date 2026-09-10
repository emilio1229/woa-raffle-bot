import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { concludeRaffle } from "../../raffleLifecycle.js";
import { raffleStore } from "../../raffleStore.js";

export default {
  data: new SlashCommandBuilder()
    .setName("raffle-end")
    .setDescription("Force-end the current ritual raffle."),

  async execute(interaction) {
    const allRaffles = raffleStore.all().filter(r => r.ready && !r.ended && !r.ending && Date.now() < r.endsAt);

    if (allRaffles.length === 0) {
      return interaction.reply({
        content: "❌ There are no active rituals to end.",
        ephemeral: true
      });
    }

    if (allRaffles.length === 1) {
      await executeRaffleEnd(interaction, allRaffles[0]);
      return;
    }

    // Multiple raffles - show dropdown
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_end_raffle")
      .setPlaceholder("Select a ritual to end");

    allRaffles.forEach(r => {
      selectMenu.addOptions({
        label: r.name || `Raffle ${r.id}`,
        value: r.id,
        description: `Prize: ${r.prize}`
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return interaction.reply({
      content: "Choose a ritual to end:",
      components: [row],
      ephemeral: true
    });
  }
};

async function executeRaffleEnd(interaction, raffle) {
  const result = await concludeRaffle(interaction.client, raffle.id);

  if (result.status === "missing") {
    return interaction.reply({
      content: "❌ That ritual is no longer active.",
      ephemeral: true
    });
  }

  if (result.status === "ending") {
    return interaction.reply({
      content: "🔮 The ritual is being finalized and will retry cleanup automatically if needed.",
      ephemeral: true
    });
  }

  return interaction.reply({
    content: "🔮 The ritual has been ended.",
    ephemeral: true
  });
}
