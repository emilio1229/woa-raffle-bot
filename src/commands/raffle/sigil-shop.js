import { SlashCommandBuilder } from "discord.js";
import { raffleStore } from "../../raffleStore.js";
import { sigilStore } from "../../sigilStore.js";
import { buildShopComponents, buildShopEmbed } from "../../sigilUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sigil-shop")
    .setDescription("Redeem sigils for weighted raffle entries.")
    .setDMPermission(false),

  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      return interaction.reply({
        content: "❌ The sigil shop can only be used inside a server.",
        flags: 64
      });
    }

    const activeRaffles = raffleStore
      .all()
      .filter(raffle => raffle.guildId === interaction.guild.id && Date.now() < raffle.endsAt && !raffle.ended);
    const balance = sigilStore.getBalance(interaction.guild.id, interaction.user.id);

    await interaction.reply({
      embeds: [buildShopEmbed(activeRaffles, balance)],
      components: buildShopComponents(activeRaffles.length === 0),
      flags: 64
    });
  }
};
