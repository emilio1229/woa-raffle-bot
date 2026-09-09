import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder
} from "discord.js";

import { raffleStore } from "../../raffleStore.js";

const MEMBERS_ROLE_ID = "MEMBERS_ROLE_ID_HERE";
const SUPPORTERS_ROLE_ID = "SUPPORTERS_ROLE_ID_HERE";

export default {
  data: new SlashCommandBuilder()
    .setName("raffle-start")
    .setDescription("Begin a new arcane ritual raffle.")
    .addStringOption(opt =>
      opt.setName("prize").setDescription("The offering for the ritual.").setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("duration").setDescription("Duration in minutes.").setRequired(true)
    ),

  async execute(interaction) {
    const prize = interaction.options.getString("prize");
    const duration = interaction.options.getInteger("duration");
    const durationMs = duration * 60 * 1000;

    const roleRow = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("tagRole")
        .setPlaceholder("Select a role to invoke in the ritual")
        .setMinValues(1)
        .setMaxValues(1)
    );

    const menuMessage = await interaction.reply({
      content: "Choose the role whose essence will be invoked:",
      components: [roleRow]
    });

    const collector = menuMessage.createMessageComponentCollector({
      filter: i => i.customId === "tagRole" && i.user.id === interaction.user.id,
      time: 60000
    });

    collector.on("collect", async roleSelection => {
      const tagRole = roleSelection.values[0];

      let wizardPhrase;

      if (tagRole === MEMBERS_ROLE_ID) {
        wizardPhrase = `Let their souls be marked by <@&${tagRole}>, keepers of the ritual flame.`;
      } else if (tagRole === SUPPORTERS_ROLE_ID) {
        wizardPhrase = `By sigil and spark, the souls of <@&${tagRole}> are called to the ritual.`;
      } else {
        wizardPhrase = `<@&${tagRole}> has been invoked by arcane decree.`;
      }

      const raffle = raffleStore.create({
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        prize,
        endsAt: Date.now() + durationMs,
        tagRole,
        wizardPhrase,
        ritualType: "soul-binding",
        entries: []
      });

      const announcementEmbed = new EmbedBuilder()
        .setTitle("🔮 THE RITUAL BEGINS 🔮")
        .setDescription(`${wizardPhrase}\n\nStep forth, bind your essence.`)
        .setColor(0x4B0082);

      await roleSelection.update({
        content: "The ritual has begun.",
        components: []
      });

      await interaction.channel.send({ embeds: [announcementEmbed] });

      const raffleEmbed = new EmbedBuilder()
        .setTitle(`🎉 Raffle: ${prize} 🎉`)
        .addFields(
          { name: "Prize", value: prize, inline: true },
          { name: "Duration", value: `${duration} minutes`, inline: true },
          { name: "Invocation", value: wizardPhrase }
        )
        .setColor(0x4B0082);

      const raffleMsg = await interaction.channel.send({ embeds: [raffleEmbed] });

      raffleStore.setMessageId(raffle.id, raffleMsg.id);
    });
  }
};
