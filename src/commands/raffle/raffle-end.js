import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { raffleStore } from "../../raffleStore.js";

export default {
  data: new SlashCommandBuilder()
    .setName("raffle-end")
    .setDescription("Force-end the current ritual raffle."),

  async execute(interaction) {
    const raffle = raffleStore.getActive(interaction.guild.id);

    if (!raffle) {
      return interaction.reply({
        content: "❌ There is no active ritual to end.",
        ephemeral: true
      });
    }

    // Mark ended
    raffleStore.update(raffle.id, { ended: true });

    // Pick winner
    let winnerId = null;
    if (raffle.entries.length > 0) {
      const randomIndex = Math.floor(Math.random() * raffle.entries.length);
      winnerId = raffle.entries[randomIndex];
    }

    // Arcane glow
    const glow = ["🔮✨", "🔮💫", "🔮🌌", "🔮⚡"];

    const embed = new EmbedBuilder()
      .setTitle(`${glow[Math.floor(Math.random() * glow.length)]} Ritual Concluded`)
      .setDescription(
        winnerId
          ? `The arcane forces have chosen <@${winnerId}>.\n\n**Prize:** ${raffle.prize}`
          : `💀 The ritual found **no souls** to bind.\n\nNo winner was chosen.`
      )
      .addFields(
        { name: "Prize", value: raffle.prize, inline: true },
        { name: "Invocation", value: raffle.wizardPhrase },
        { name: "Bound Souls", value: `${raffle.entries.length}`, inline: true }
      )
      .setColor(0x4B0082);

    // Update the raffle message (remove buttons)
    try {
      const channel = await interaction.client.channels.fetch(raffle.channelId);
      const msg = await channel.messages.fetch(raffle.messageId).catch(() => null);

      if (msg) {
        await msg.edit({
          embeds: [embed],
          components: []
        });
      }
    } catch (err) {
      console.error("Manual end update failed:", err);
    }

    return interaction.reply({
      content: "🔮 The ritual has been ended.",
      ephemeral: true
    });
  }
};
