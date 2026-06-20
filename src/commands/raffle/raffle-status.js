// src/commands/raffle/raffle-status.js
import { SlashCommandBuilder } from "discord.js";
import { raffleStore } from "../../raffleStore.js";
import { buildRaffleSelectMenu } from "../../components.js";
import { buildRaffleEmbed } from "../../embedBuilder.js";

export const data = new SlashCommandBuilder()
  .setName("raffle-status")
  .setDescription("Show active raffles in this guild.")
  .setDMPermission(false);

export async function execute(interaction) {
  let deferred = false;
  try {
    try {
      await interaction.deferReply({ ephemeral: true });
      deferred = true;
    } catch {
      deferred = false;
    }

    const active = raffleStore.activeInGuild(interaction.guild.id);
    if (!active || active.length === 0) {
      const msg = "There are no active raffles in this server.";
      if (deferred) return interaction.editReply({ content: msg });
      try { return interaction.reply({ content: msg, flags: 64 }); } catch { return interaction.channel.send(msg); }
    }

    // If many raffles, show a select menu; otherwise show the single raffle embed
    if (active.length === 1) {
      const embed = buildRaffleEmbed(active[0], active[0].entries.length);
      if (deferred) return interaction.editReply({ embeds: [embed] });
      try { return interaction.reply({ embeds: [embed], flags: 64 }); } catch { return interaction.channel.send({ embeds: [embed] }); }
    }

    // multiple: send a select menu so user can pick
    const row = buildRaffleSelectMenu(active, "select_raffle_status");
    if (deferred) return interaction.editReply({ content: "Choose a raffle:", components: [row] });
    try { return interaction.reply({ content: "Choose a raffle:", components: [row], flags: 64 }); } catch { return interaction.channel.send({ content: "Choose a raffle:", components: [row] }); }
  } catch (err) {
    console.error("raffle-status error:", err);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "An error occurred while fetching raffles.", flags: 64 });
      } else {
        await interaction.editReply({ content: "An error occurred while fetching raffles." });
      }
    } catch {}
  }
}

