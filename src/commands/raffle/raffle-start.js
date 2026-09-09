import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder
} from "discord.js";

import { raffleStore } from "../../raffleStore.js";

// Replace these with your actual role IDs
const MEMBERS_ROLE_ID = '1441536017810329801';
const SUPPORTERS_ROLE_ID = '1469217699648245843';

export const command = {
  data: new SlashCommandBuilder()
    .setName('raffle-start')
    .setDescription('Start a new arcane raffle.')
    .addStringOption(opt =>
      opt.setName('prize')
        .setDescription('The prize for the raffle.')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('duration')
        .setDescription('Duration in minutes.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const prize = interaction.options.getString('prize');
    const duration = interaction.options.getInteger('duration');
    const durationMs = duration * 60 * 1000;

    // Build modal-like role selector
    const roleRow = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('tagRole')
        .setPlaceholder('Select a role to invoke in the ritual')
        .setMinValues(1)
        .setMaxValues(1)
    );

    await interaction.reply({
      content: 'Select the role to invoke for this ritual:',
      components: [roleRow],
      ephemeral: true
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.customId !== 'tagRole') return;

      const tagRole = i.values[0];

      // Wizard phrase logic
      let wizardPhrase;

      if (tagRole === MEMBERS_ROLE_ID) {
        wizardPhrase = `Let their souls be marked by <@&${tagRole}>, keepers of the ritual flame.`;
      } else if (tagRole === SUPPORTERS_ROLE_ID) {
        wizardPhrase = `By sigil and spark, the souls of <@&${tagRole}> are called to the ritual.`;
      } else {
        wizardPhrase = `<@&${tagRole}> has been invoked.`;
      }

      // GRAND ANNOUNCEMENT EMBED
      const announcementEmbed = new EmbedBuilder()
        .setTitle('🔮 THE RITUAL BEGINS 🔮')
        .setDescription(
          `${wizardPhrase}\n\n` +
          `Step forth, bind your essence, and be counted among the chosen.`
        )
        .setColor(0x4B0082)
        .setFooter({ text: 'The circle awakens…' });

      // Start raffle (existing logic)
      const raffleId = await startRaffle(interaction, prize, durationMs, tagRole);

      // STANDARD RAFFLE EMBED
      const raffleEmbed = new EmbedBuilder()
        .setTitle(`🎉 Raffle: ${prize} 🎉`)
        .addFields(
          { name: 'Prize', value: prize, inline: true },
          { name: 'Duration', value: `${duration} minutes`, inline: true },
          { name: 'Arcane Invocation', value: wizardPhrase, inline: false }
        )
        .setColor(0x4B0082);

      await i.update({
        content: 'The ritual has begun.',
        components: []
      });

      // Send both embeds publicly
      await interaction.channel.send({ embeds: [announcementEmbed] });
      await interaction.channel.send({ embeds: [raffleEmbed] });
    });
  }
};
