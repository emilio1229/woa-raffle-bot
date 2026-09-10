import { EmbedBuilder } from "discord.js";

export function buildRaffleEmbed(raffle, entryCount, winnerId = null) {
  const embed = new EmbedBuilder()
    .setColor(0x8A2BE2)
    .setTitle("🔮 Ritual Raffle")
    .addFields(
      {
        name: "🎁 Offering",
        value: `**${raffle.prize}**`,
        inline: false
      },
      {
        name: "🪄 Arcane Invocation",
        value: raffle.wizardPhrase || "The sigils await a chosen role…",
        inline: false
      }
    );

  // Active ritual
  if (!raffle.ended) {
    embed.addFields(
      {
        name: "⏳ Ritual Ends",
        value: `<t:${Math.floor(raffle.endsAt / 1000)}:F>`
      },
      {
        name: "💀 Souls Bound",
        value: `${entryCount} ${entryCount === 1 ? "soul" : "souls"}`
      },
      {
        name: "🧙‍♂️ Invoked Role",
        value: raffle.tagRole ? `<@&${raffle.tagRole}>` : "None",
        inline: false
      }
    );

    embed.setFooter({
      text: "Offer your soul to the ritual…"
    });
  }

  return embed;
}

export function buildRaffleEndedEmbed(raffle, entryCount, winnerId = null) {
  let description = "";

  if (winnerId) {
    description = `🏆 The ritual has chosen its champion!\n\n👑 **Winner:** <@${winnerId}>`;
  } else {
    description = "💀 No souls were bound — the ritual yields no winner.";
  }

  const embed = new EmbedBuilder()
    .setColor(0xFF6B00)
    .setTitle("✨ Ritual Complete ✨")
    .setDescription(description)
    .addFields(
      {
        name: "🎁 Offering",
        value: `**${raffle.prize}**`,
        inline: false
      },
      {
        name: "📜 Final Souls Bound",
        value: `${entryCount} ${entryCount === 1 ? "soul" : "souls"}`
      }
    )
    .setFooter({ text: "The ritual has concluded." })
    .setTimestamp();

  return embed;
}
