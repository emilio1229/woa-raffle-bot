import { SlashCommandBuilder } from "discord.js";
import { sigilStore } from "../../sigilStore.js";
import { buildBalanceEmbed } from "../../sigilUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("my-sigils")
    .setDescription("View your sigil balance and recent ledger activity."),

  async execute(interaction) {
    const userRecord = sigilStore.getUser(interaction.guild.id, interaction.user.id);

    await interaction.reply({
      embeds: [
        buildBalanceEmbed(
          interaction.user,
          userRecord.balance,
          userRecord.transactions.slice(0, 10),
          "💠 My Sigils",
          "Your personal sigil ledger and recent ritual activity."
        )
      ],
      flags: 64
    });
  }
};
