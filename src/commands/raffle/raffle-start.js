// src/commands/raffle/raffle-start.js
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
      opt.setName("name")
        .setDescription("Name of the ritual raffle")
        .setRequired(true)
    )
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
    const name = interaction.options.getString("name");
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
      await roleSelection.deferUpdate().catch(() => {});

      const tagRole = roleSelection.values[0];

      // NEW — Arcane invocation text (no role mention)
      const invocationText = "Ancient sigils awaken, humming softly in the astral dark.";

      // Create raffle entry
      const raffle = raffleStore.create({
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        name,
        prize,
        endsAt,
        tagRole,
        invocationText,
        ritualType: "soul-binding",
        entries: []
      });

      // Ritual announcement
      const announcementEmbed = new EmbedBuilder()
        .setTitle("🔮 THE RITUAL BEGINS 🔮")
        .setDescription(
          [
            "The circle stirs as arcane energies gather.",
            "A ritual has been cast — the astral veil thins.",
            "",
            `⟐ **Ritual Name:** ${name}`,
            `🎁 **Offering:** ${prize}`
          ].join("\n")
        )
        .setColor(0x4B0082);

      await interaction.channel.send({ embeds: [announcementEmbed] });

      // Raffle embed (new layout)
      const raffleEmbed = new EmbedBuilder()
        .setTitle(`🔮 ${name}`)
        .setColor(0x4B0082)
        .setDescription(
          [
            `A ritual has been cast. The circle hums with quiet power.`,
            ``,
            `**✨ Invocation**`,
            `⟐ ${invocationText}`,
            ``,
            `**🎁 Prize**`,
            `${prize}`,
            ``,
            `**⏳ Ends At**`,
            `<t:${Math.floor(endsAt / 1000)}:F>`,
            ``,
            `**🩸 Bound Souls**`,
            `${raffle.entries.length}`
          ].join("\n")
        );

      // Buttons
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
