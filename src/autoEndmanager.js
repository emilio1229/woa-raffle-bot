// src/autoEndManager.js
import { raffleStore } from "./raffleStore.js";
import { EmbedBuilder } from "discord.js";

export function startAutoEndLoop(client) {
  setInterval(async () => {
    const raffles = raffleStore.all();

    for (const raffle of raffles) {
      if (raffle.ended) continue;
      if (Date.now() < raffle.endsAt) continue;

      // Mark ended in store
      raffleStore.update(raffle.id, { ended: true });

      try {
        const channel = await client.channels.fetch(raffle.channelId);
        if (!channel) continue;

        const message = await channel.messages.fetch(raffle.messageId).catch(() => null);
        if (!message) continue;

        // Pick winner
        let winnerId = null;
        if (raffle.entries.length > 0) {
          const randomIndex = Math.floor(Math.random() * raffle.entries.length);
          winnerId = raffle.entries[randomIndex];
        }

        // Final embed with arcane glow
        const glow = ["🔮✨", "🔮💫", "🔮🌌", "🔮⚡"];
        const finalEmbed = new EmbedBuilder()
          .setTitle(`${glow[Math.floor(Math.random() * glow.length)]} The Ritual Has Concluded`)
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
          .setColor(0x4B0082)
          .setFooter({ text: "The circle grows quiet…" });

        // Remove buttons + update embed
        await message.edit({
          embeds: [finalEmbed],
          components: []
        });

        // Announce winner
        if (winnerId) {
          await channel.send(
            `🔮 <@${winnerId}> has been chosen by the ritual! The prize: **${raffle.prize}**`
          );
        } else {
          await channel.send(`💀 The ritual found no souls to bind. No winner was chosen.`);
        }
      } catch (err) {
        console.error("Auto-end error:", err);
      }
    }
  }, 5000); // check every 5 seconds
}
