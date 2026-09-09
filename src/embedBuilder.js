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

  // Completed ritual
  else {
    embed.addFields(
      {
        name: "🏁 Ritual Completed",
        value: `<t:${Math.floor(raffle.endsAt / 1000)}:F>`
      },
      {
        name: "📜 Final Souls Bound",
        value: `${entryCount} ${entryCount === 1 ? "soul" : "souls"}`
      },
      {
        name: "👑 Chosen Soul",
        value: winnerId ? `<@${winnerId}>` : "None"
      },
      {
        name: "🧙‍♂️ Invoked Role",
        value: raffle.tagRole ? `<@&${raffle.tagRole}>` : "None",
        inline: false
      }
    );

    embed.setFooter({
      text: "The ritual is complete."
    });
  }

  return embed;
}
