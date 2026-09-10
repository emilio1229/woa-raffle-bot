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
        value: raffle.invocationText || "The sigils await a chosen role…",
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
  if (winnerId) {
    const winnerTag = `<@${winnerId}>`;
    const roleTag = raffle.tagRole ? ` <@&${raffle.tagRole}>` : "";

    const embed = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle("✨ A Champion Has Been Chosen ✨")
      .setDescription(
        `The sigil storm erupts in violent cosmic fury.\n\n🔮 **Winner:** ${winnerTag}${roleTag}`
      )
      .addFields(
        { name: "🎁 Prize", value: `**${raffle.prize}**`, inline: false },
        { name: "📜 Souls Bound", value: `${entryCount} ${entryCount === 1 ? "soul" : "souls"}`, inline: true }
      )
      .setFooter({ text: "Wizards of Ark • Ascension Complete" })
      .setTimestamp();

    return embed;
  } else {
    const embed = new EmbedBuilder()
      .setColor(0x2F4F4F)
      .setTitle("Ritual Concluded — No Champion")
      .setDescription("The ritual faded into the void; no winner could be chosen.")
      .addFields(
        { name: "🎁 Prize", value: `**${raffle.prize}**`, inline: false },
        { name: "📜 Souls Bound", value: `${entryCount} ${entryCount === 1 ? "soul" : "souls"}`, inline: true }
      )
      .setFooter({ text: "Wizards of Ark" })
      .setTimestamp();

    return embed;
  }
}
