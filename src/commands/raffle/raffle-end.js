import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { raffleStore } from "../../raffleStore.js";

export default {
  data: new SlashCommandBuilder()
    .setName("raffle-end")
    .setDescription("Force-end the current ritual raffle."),

  async execute(interaction) {
    const allRaffles = raffleStore.all().filter(r => Date.now() < r.endsAt);

    if (allRaffles.length === 0) {
      return interaction.reply({
        content: "❌ There are no active rituals to end.",
        ephemeral: true
      });
    }

    if (allRaffles.length === 1) {
      await executeRaffleEnd(interaction, allRaffles[0]);
      return;
    }

    // Multiple raffles - show dropdown
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_end_raffle")
      .setPlaceholder("Select a ritual to end");

    allRaffles.forEach(r => {
      selectMenu.addOptions({
        label: r.name || `Raffle ${r.id}`,
        value: r.id,
        description: `Prize: ${r.prize}`
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return interaction.reply({
      content: "Choose a ritual to end:",
      components: [row],
      ephemeral: true
    });
  }
};

async function executeRaffleEnd(interaction, raffle) {
  raffleStore.markEnded(raffle.id);

  let winnerId = null;
  if (raffle.entries.length > 0) {
    const randomIndex = Math.floor(Math.random() * raffle.entries.length);
    winnerId = raffle.entries[randomIndex];
  }

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
      { name: "Invocation", value: raffle.invocationText || "The sigils await...", inline: false },
      { name: "Bound Souls", value: `${raffle.entries.length}`, inline: true }
    )
    .setColor(0x4B0082);

  try {
    const channel = await interaction.client.channels.fetch(raffle.channelId);
    const msg = await channel.messages.fetch(raffle.messageId).catch(() => null);

    if (msg) {
      await msg.edit({
        embeds: [embed],
        components: []
      });
    }

    if (winnerId) {
      const grandEmbed = new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle("✨ A Champion Has Been Chosen ✨")
        .setDescription("The sigil storm erupts in violent cosmic fury.")
        .addFields(
          { name: "👑 Winner", value: `<@${winnerId}>`, inline: false },
          { name: "📢 Ritual Role", value: raffle.tagRole ? `<@&${raffle.tagRole}>` : "None", inline: false },
          { name: "🎁 Prize", value: `**${raffle.prize}**`, inline: false },
          { name: "📜 Souls Bound", value: `${raffle.entries.length}`, inline: true }
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
    }
  } catch (err) {
    console.error("Manual end failed:", err);
  }

  return interaction.reply({
    content: "🔮 The ritual has been ended.",
    ephemeral: true
  });
}
