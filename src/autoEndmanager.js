import { raffleStore } from "./raffleStore.js";
import { buildRaffleEmbed } from "./embedBuilder.js";

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

        // Build final embed
        const finalEmbed = buildRaffleEmbed(
          raffle,
          raffle.entries.length,
          winnerId
        );

        // Update message
        await message.edit({
          content: winnerId
            ? `🔮 <@${winnerId}> has been chosen by the ritual!`
            : `💀 The ritual found no souls to bind.`,
          embeds: [finalEmbed],
          components: []
        });

      } catch (err) {
        console.error("Auto-end error:", err);
      }
    }
  }, 5000);
}
