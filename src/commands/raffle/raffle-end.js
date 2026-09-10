import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from "discord.js";
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
    raffleStore.markEnded(raffle.id);

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
        { name: "Prize", value: raffle.prize || "Unknown", inline: true },
        { name: "Invocation", value: raffle.wizardPhrase || "The sigils await...", inline: false },
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

      // Grand Winner Announcement (fancier)
      try {
        if (winnerId) {
          const winnerTag = `<@${winnerId}>`;
          const roleTag = raffle.tagRole ? ` <@&${raffle.tagRole}>` : "";

          const grandEmbed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setTitle(`✨ A Champion Has Been Chosen ✨`)
            .setDescription(
              `The sigil storm erupts in violent cosmic fury.\n\n🔮 **Winner:** ${winnerTag}${roleTag}\n\nThe obelisk cracks open as destiny crowns its new bearer.`
            )
            .setImage("attachment://woa_winner_bg.png")
            .setFooter({ text: "Wizards of Ark • Ascension Complete" })
            .setTimestamp();

          const attachment = new AttachmentBuilder("./assets/woa_winner_bg.png", { name: "woa_winner_bg.png" });

          await channel.send({
            embeds: [grandEmbed],
            files: [attachment],
            allowedMentions: { roles: raffle.tagRole ? [raffle.tagRole] : [] }
          });
        } else {
          // No winner — send a consolation embed
          const noWinnerEmbed = new EmbedBuilder()
            .setColor(0x2F4F4F)
            .setTitle(`Ritual Concluded — No Champion`)
            .setDescription(`The ritual faded into the void; no winner could be chosen.`)
            .setFooter({ text: "Wizards of Ark" })
            .setTimestamp();

          await channel.send({
            embeds: [noWinnerEmbed]
          });
        }
      } catch (sendErr) {
        console.error("Announcement send failed:", sendErr);
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
