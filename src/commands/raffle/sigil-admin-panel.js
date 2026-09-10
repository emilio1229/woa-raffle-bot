import { SlashCommandBuilder, PermissionsBitField } from "discord.js";
import { raffleStore } from "../../raffleStore.js";
import { sigilStore } from "../../sigilStore.js";
import { buildAdminPanelEmbed, requireAdmin } from "../../sigilUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sigil-admin-panel")
    .setDescription("View guild-wide sigil economy stats.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    if (!(await requireAdmin(interaction))) {
      return;
    }

    const stats = sigilStore.getGuildStats(interaction.guild.id);
    const activeRaffles = raffleStore
      .all()
      .filter(raffle => raffle.guildId === interaction.guild.id && raffle.ready && Date.now() < raffle.endsAt && !raffle.ended && !raffle.ending);

    await interaction.reply({ embeds: [buildAdminPanelEmbed(stats, activeRaffles)] });
  }
};
