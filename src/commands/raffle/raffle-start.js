// src/commands/raffle/raffle-start.js
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { raffleStore } from "../../raffleStore.js";
import { buildRaffleEmbed } from "../../embedBuilder.js";
import { buildRaffleButtons } from "../../components.js";
import { parseTime } from "../../utils/timeParser.js";

export const data = new SlashCommandBuilder()
  .setName("raffle-start")
  .setDescription("Begin a new ritual raffle.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDMPermission(false)
  .addStringOption(opt =>
    opt.setName("prize")
      .setDescription("The offering for the ritual.")
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("duration")
      .setDescription("Duration or end time (e.g., 10m, 7d, 06/18/2026 2:30 PM)")
      .setRequired(true)
  );

export async function execute(interaction) {
  let deferred = false;

  try {
    // Defer as early as possible to avoid token expiry
    try {
      await interaction.deferReply();
      deferred = true;
    } catch (deferErr) {
      // If Discord says Unknown interaction (10062) or defer fails,
      // we will fall back to sending the raffle message directly to the channel.
      console.warn("Could not defer interaction; falling back to channel send.", deferErr?.code ?? deferErr);
      deferred = false;
    }

    const prize = interaction.options.getString("prize");
    const durationInput = interaction.options.getString("duration");

    const endsAt = parseTime(durationInput);
    if (!endsAt || endsAt < Date.now()) {
      // If we deferred, edit the deferred reply; otherwise try to reply (may fail) or send to channel
      const invalidMsg = "❌ Invalid time format. Try: `10m`, `7d`, `06/18/2026 2:30 PM`, `tomorrow 5pm`";
      if (deferred) {
        await interaction.editReply({ content: invalidMsg, ephemeral: true });
      } else {
        try {
          await interaction.reply({ content: invalidMsg, ephemeral: true });
        } catch {
          await interaction.channel.send({ content: invalidMsg });
        }
      }
      return;
    }

    // Create raffle
    const raffle = raffleStore.create({
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      messageId: null,
      prize,
      endsAt,
      entries: [],
      ended: false
    });

    const embed = buildRaffleEmbed(raffle, 0);

    // If we successfully deferred, edit the deferred reply; otherwise send to channel
    if (deferred) {
      const msg = await interaction.editReply({
        content: "🔮 A new ritual has begun…",
        embeds: [embed],
        components: [buildRaffleButtons(raffle.id)]
      });
      // editReply returns the message object in v14 when fetchReply is used; if not available, fetch it
      // Try to set messageId if we have it
      try {
        raffleStore.setMessageId(raffle.id, msg.id ?? (await interaction.fetchReply()).id);
      } catch {
        // ignore if we can't fetch
      }
    } else {
      // fallback: send directly to the channel
      const sent = await interaction.channel.send({
        content: "🔮 A new ritual has begun…",
        embeds: [embed],
        components: [buildRaffleButtons(raffle.id)]
      });
      raffleStore.setMessageId(raffle.id, sent.id);
      // Try to inform the user privately that the raffle started (best-effort)
      try {
        await interaction.user.send(`Your raffle "${prize}" has been posted in ${interaction.channel}.`);
      } catch {
        // ignore DM failures
      }
    }
  } catch (err) {
    console.error("raffle-start error:", err);
    // Try to inform the user
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "An error occurred while starting the raffle.", ephemeral: true });
      } else {
        await interaction.editReply({ content: "An error occurred while starting the raffle." });
      }
    } catch {
      // ignore reply errors
    }
  }
}
