// src/autoEndManager.js
import { raffleStore } from "./raffleStore.js";
import { EmbedBuilder } from "discord.js";

export function startAutoEndLoop(client) {
  setInterval(async () => {
    const now = Date.now();
    const raffles = raffleStore.all();

    for (const raffle of raffles) {
      if (raffle.ended) continue;
      if (raffle.endsAt > now) continue;

      // Mark ended
      raffleStore.markEnded(raffle.id);

      // Pick winner
      let winnerId = null;
      if (raffle.entries.length > 0) {
        const randomIndex = Math.floor(Math.random() * raffle.entries.length);
        winnerId = raffle.entries[randomIndex];
      }

      try {
        const channel = await client.channels.fetch(raffle.channelId);
        const message = await channel.messages.fetch(raffle.messageId);

        // --- RITUAL ENDING PHRASES ---
        let endingPhrase;

        if (winnerId) {
          endingPhrase =
            `🔮 The ritual has spoken.\n\n` +
            `By ancient decree, **<@${winnerId}>** has been chosen.\n\n` +
            `The circle falls silent…`;
        } else {
          endingPhrase =
            `💀 The ritual found no souls worthy.\n\n` +
            `No essence was bound to the circle.\n\n` +
            `The sigils fade into darkness…`;
        }

        // --- RITUAL COMPLETE EMBED ---
        const ritualEmbed = new EmbedBuilder()
          .setTitle("🔮 THE RITUAL CONCLUDES 🔮")
          .setDescription(
            `${raffle.wizardPhrase}\n\n` + // The original incantation
            endingPhrase
          )
          .setColor(0x4B0082)
          .setFooter({ text: "The circle grows quiet…" });

        // Update original raffle message
        await message.edit({
          content: winnerId
            ? `🔮 <@${winnerId}> has been chosen by the ritual!`
            : `💀 The ritual found no souls to bind.`,
          embeds: [ritualEmbed],
          components: []
        });

        // Send a public ritual completion announcement
        await channel.send({ embeds: [ritualEmbed] });

      } catch (err) {
        console.error("Auto-end error:", err);
      }
    }
  }, 5000);
}
