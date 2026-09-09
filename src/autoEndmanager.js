// src/autoEndmanager.js
import { raffleStore } from "./raffleStore.js";

export function startAutoEndLoop(client) {
  setInterval(async () => {
    try {
      const raffles = raffleStore.all();

      for (const raffle of raffles) {
        if (Date.now() >= raffle.endsAt) {
          // End the raffle
          raffleStore.end(raffle.id);

          // Announce winner
          const channel = await client.channels.fetch(raffle.channelId);

          let winnerText = "No souls were bound. The ritual fades silently.";

          if (raffle.entries.length > 0) {
            const winner = raffle.entries[Math.floor(Math.random() * raffle.entries.length)];
            winnerText = `🔮 **The ritual chooses:** <@${winner}>`;
          }

          await channel.send(winnerText);
        }
      }
    } catch (err) {
      console.error("autoEndManager error:", err);
    }
  }, 5000); // check every 5 seconds
}
