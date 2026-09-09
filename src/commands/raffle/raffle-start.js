import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import { raffleStore } from "../../raffleStore.js";
import { parseTime } from "../../utils/timeParser.js";

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

    await interaction.reply({
      content: "Choose the role whose essence will be invoked:",
      components: [roleRow]
    });

    const menuMessage = await interaction.fetchReply();

    const collector = menuMessage.createMessageComponentCollector({
      filter: i => i.customId === "tagRole" && i.user.id === interaction.user.id,
      time: 60000
    });

    collector.on("collect", async roleSelection => {
      // SAFEST ACKNOWLEDGMENT FOR RAILWAY
      await roleSelection.deferUpdate().catch(() => {});

      const tagRole = roleSelection.values[0];
      const roleObj = interaction.guild.roles.cache.get(tagRole);
      const roleName = roleObj ? roleObj.name : "Unknown Role";

      // Dynamic wizard phrase
      const wizardPhrase = `By arcane decree, the souls of <@&${tagRole}> — **${roleName}** — are summoned to the ritual.`;

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

      // Bind / Unbind buttons
      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("bindSoul")
          .setLabel("🔮 Bind Soul")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("unbindSoul")
          .setLabel("💀 Unbind Soul")
          .setStyle(ButtonStyle.Secondary)
      );

      const raffleMsg = await interaction.channel.send({
        embeds: [raffleEmbed],
        components: [buttonRow]
      });

      raffleStore.setMessageId(raffle.id, raffleMsg.id);

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
