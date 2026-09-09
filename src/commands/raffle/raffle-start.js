import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder
} from "discord.js";

import { raffleStore } from "../../raffleStore.js";

// Replace these with your actual role IDs
const MEMBERS_ROLE_ID = "MEMBERS_ROLE_ID_HERE";
const SUPPORTERS_ROLE_ID = "SUPPORTERS_ROLE_ID_HERE";

export default {
  data: new SlashCommandBuilder()
    .setName("raffle-start")
    .setDescription("Begin a new arcane ritual raffle.")
    .addStringOption(opt =>
      opt
        .setName("prize")
        .setDescription("The offering for the ritual.")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName("duration")
        .setDescription("Duration in minutes.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const prize = interaction.options.getString("prize");
    const duration = interaction.options.getInteger("duration");
    const durationMs = duration * 60 * 1000;

    // Build role selector
    const roleRow = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("tagRole")
        .setPlaceholder("Select a role to invoke in the ritual")
        .setMinValues(1)
        .setMaxValues(1)
    );

    // Send ephemeral role selector
    await interaction.reply({
      content: "Choose the role whose essence will be invoked:",
      components: [roleRow],
      ephemeral: true
    });

    // Wait for the user's selection (ephemeral-safe)
    const roleSelection = await interaction.awaitMessageComponent({
      filter: i => i.customId === "tagRole" && i.user.id === interaction.user.id,
      time: 60000
    });

    const tagRole = roleSelection.values[0];

    // Wizard phrase logic
    let wizardPhrase;

    if (tagRole === MEMBERS_ROLE_ID) {
      wizardPhrase = `Let their souls be marked by <@&${tagRole}>, keepers of the ritual flame.`;
    } else if (tagRole === SUPPORTERS_ROLE_ID) {
      wizardPhrase = `By sigil and spark, the souls of <@&${tagRole}> are called to the ritual.`;
    } else {
      wizardPhrase = `<@&${tagRole}> has been invoked by arcane decree.`;
    }

    // GRAND ANNOUNCEMENT EMBED
    const announcementEmbed = new EmbedBuilder()
      .setTitle("🔮 THE RITUAL BEGINS 🔮")
      .setDescription(
        `${wizardPhrase}\n\n` +
          `Step forth, bind your essence, and be counted among the chosen.`
      )
      .setColor(0x4B0082)
      .setFooter({ text: "The circle awakens…" });

    // Create raffle in store
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

    // STANDARD RITUAL RAFFLE EMBED
    const raffleEmbed = new EmbedBuilder()
      .setTitle(`🎉 Raffle: ${prize} 🎉`)
      .addFields(
        { name: "Prize", value: prize, inline: true },
        { name: "Duration", value: `${duration} minutes`, inline: true },
        { name: "Arcane Invocation", value: wizardPhrase, inline: false }
      )
      .setColor(0x4B0082);

    // Acknowledge the role selection
    await roleSelection.update({
      content: "The ritual has begun.",
      components: []
    });

    // Send both embeds publicly
    await interaction.channel.send({ embeds: [announcementEmbed] });

    const raffleMsg = await interaction.channel.send({
      embeds: [raffleEmbed]
    });

    // Save messageId for autoEndManager + bind/unbind
    raffleStore.setMessageId(raffle.id, raffleMsg.id);
  }
};
