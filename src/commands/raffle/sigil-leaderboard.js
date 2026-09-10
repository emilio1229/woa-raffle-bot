import { SlashCommandBuilder, PermissionsBitField } from "discord.js";
import { sigilStore } from "../../sigilStore.js";
import { buildLeaderboardEmbed, requireAdmin } from "../../sigilUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sigil-leaderboard")
    .setDescription("Show the top 10 sigil earners.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    if (!(await requireAdmin(interaction))) {
      return;
    }

    const leaderboard = sigilStore.getLeaderboard(interaction.guild.id, 10);
    const lines = await Promise.all(
      leaderboard.map(async (entry, index) => {
        const member = await interaction.guild.members.fetch(entry.userId).catch(() => null);
        const name = member?.displayName ?? `<@${entry.userId}>`;
        return `**${index + 1}.** ${name} — **${entry.balance}** sigils`;
      })
    );

    await interaction.reply({ embeds: [buildLeaderboardEmbed(lines)] });
  }
};
