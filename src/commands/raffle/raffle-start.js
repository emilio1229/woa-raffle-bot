import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder
} from "discord.js";

import { raffleStore } from "../../raffleStore.js";
import { parseTime } from "../../utils/timeParser.js";

// Replace with your actual role IDs
const MEMBERS_ROLE_ID = "MEMBERS_ROLE_ID_HERE";
const SUPPORTERS_ROLE_ID = "SUPPORTERS_ROLE_ID_HERE";

export default {
  data: new SlashCommandBuilder()
    .setName("raffle-start")
    .setDescription("Begin a new arcane ritual raffle.")
    .addStringOption(opt =>
      opt.setName("prize")
        .setDescription("The offering for the ritual.")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("duration")
        .setDescription("Duration (10m, 2h, tomorrow 5pm, etc.)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const prize = interaction.options.getString("prize");
    const durationInput = interaction.options.getString("duration");

    // Parse natural-language time
    const endsAt = parseTime(durationInput);

    if (!endsAt || isNaN(endsAt)) {
      return interaction.reply({
        content: "❌ I could not understand that time format.",
        flags: 64
      });
    }

    const durationMs = endsAt - Date.now();
    if (durationMs <= 0) {
      return interaction.reply({
        content: "❌ That time is already in the past.",
        flags: 64
      });
    }

    // Role selection menu
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
      // SAFELY acknowledge the interaction
      await roleSelection.deferUpdate();

      const tagRole = roleSelection.values[0];

      let wizardPhrase;

      if (tagRole === MEMBERS_ROLE_ID) {
        wizardPhrase = `Let their souls be marked by <@&${tagRole}>, keepers of the ritual flame.`;
      } else if (tagRole === SUPPORTERS_ROLE_ID) {
        wizardPhrase = `By sigil and spark, the souls of <@&${tagRole}> are called to the ritual.`;
      } else {
        wizardPhrase = `<@&${tagRole}> has been invoked by arcane decree.`;
      }

      // Create raffle entry
      const raffle = raffleStore.create({
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        prize,
        endsAt,
        tagRole,
        wizardPhrase,
        ritualType: "soul-binding",
        entries: []
      });

      // Ritual announcement
      const announcementEmbed = new EmbedBuilder()
        .setTitle("🔮 THE RITUAL BEGINS 🔮")
        .setDescription(`${wizardPhrase}\n\nStep forth, bind your essence.`)
        .setColor(0x4B0082);

      await interaction.channel.send({ embeds: [announcementEmbed] });

      // Raffle embed
      const raffleEmbed = new EmbedBuilder()
        .setTitle(`🎉 Raffle: ${prize} 🎉`)
        .addFields(
          { name: "Prize", value: prize, inline: true },
          { name: "Ends At", value: `<t:${Math.floor(endsAt / 1000)}:F>`, inline: true },
          { name: "Invocation", value: wizardPhrase }
        )
        .setColor(0x4B0082);

      const raffleMsg = await interaction.channel.send({ embeds: [raffleEmbed] });

      // Save message ID
      raffleStore.setMessageId(raffle.id, raffleMsg.id);

      // Remove the role menu
      await menuMessage.edit({
        content: "The ritual has begun.",
        components: []
      });
    });

    collector.on("end", async collected => {
      if (collected.size === 0) {
        await menuMessage.edit({
          content: "❌ Ritual cancelled — no role was selected.",
          components: []
        });
      }
    });
  }
};
