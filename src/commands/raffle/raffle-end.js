// src/commands/raffle/raffle-end.js
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { raffleStore } from "../../raffleStore.js";
import { buildRaffleEmbed } from "../../embedBuilder.js";
import { buildRaffleSelectMenu } from "../../components.js";

export const data = new SlashCommandBuilder()
  .setName("raffle-end")
  .setDescription("End an active raffle immediately.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDMPermission(false)
  .addStringOption(opt =>
    opt.setName("id")
      .setDescription("Raffle id or messageId (optional). Leave empty to pick from active raffles.")
      .setRequired(false)
  );

async function finishRaffle(interaction, raffle) {
  raffleStore.markEnded(raffle.id);
  const updated = raffleStore.findById(raffle.id);
  const entries = updated.entries ?? [];
  let resultText;
  if (entries.length === 0) {
    resultText = "No entries — no winner.";
  } else {
    const winner = entries[Math.floor(Math.random() * entries.length)];
    resultText = `Winner: <@${winner}>`;
  }

  try {
    const channel = await interaction.client.channels.fetch(updated.channelId);
    const msg = await channel.messages.fetch(updated.messageId);
    const embed = buildRaffleEmbed(updated, updated.entries.length);
    await msg.edit({ embeds: [embed], components: [] });
  } catch (err) {
    // ignore if we can't edit original message
  }

  return resultText;
}

export async function execute(interaction) {
  let deferred = false;
  try {
    try {
      await interaction.deferReply({ ephemeral: true });
      deferred = true;
    } catch {
      deferred = false;
    }

    const input = interaction.options.getString("id")?.trim();

    if (input) {
      let raffle = raffleStore.findById(input);
      if (!raffle) raffle = raffleStore.findByMessageId(input);
      if (!raffle) {
        const msg = "Raffle not found for that id/messageId.";
        if (deferred) return interaction.editReply({ content: msg });
        try { return interaction.reply({ content: msg, flags: 64 }); } catch { return interaction.channel.send(msg); }
      }

      const resultText = await finishRaffle(interaction, raffle);
      const reply = `Raffle ended. ${resultText}`;
      if (deferred) return interaction.editReply({ content: reply });
      try { return interaction.reply({ content: reply, flags: 64 }); } catch { return interaction.channel.send(reply); }
    }

    const active = raffleStore.activeInGuild(interaction.guild.id);
    if (!active || active.length === 0) {
      const msg = "There are no active raffles in this server.";
      if (deferred) return interaction.editReply({ content: msg });
      try { return interaction.reply({ content: msg, flags: 64 }); } catch { return interaction.channel.send(msg); }
    }

    const row = buildRaffleSelectMenu(active, "select_end_raffle");
    if (deferred) return interaction.editReply({ content: "Choose a raffle to end:", components: [row] });
    try { return interaction.reply({ content: "Choose a raffle to end:", components: [row], flags: 64 }); } catch { return interaction.channel.send({ content: "Choose a raffle to end:", components: [row] }); }
  } catch (err) {
    console.error("raffle-end error:", err);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "An error occurred while ending the raffle.", flags: 64 });
      } else {
        await interaction.editReply({ content: "An error occurred while ending the raffle." });
      }
    } catch {}
  }
}
