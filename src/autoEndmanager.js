// src/autoEndmanager.js
import { concludeRaffle } from "./raffleLifecycle.js";
import { raffleStore } from "./raffleStore.js";

export function startAutoEndLoop(client) {
  setInterval(async () => {
    try {
      const dueRaffles = raffleStore
        .all()
        .filter(raffle => raffle.ending || (!raffle.ended && Date.now() >= raffle.endsAt));

      for (const raffle of dueRaffles) {
        console.log(`[autoEndManager] Ending raffle ${raffle.id} (guild=${raffle.guildId})`);
        const result = await concludeRaffle(client, raffle.id);

        if (result.status === "ended") {
          console.log(
            `[autoEndManager] raffle ${raffle.id} ended with ${result.entryCount} entries`
          );
        }
      }
    } catch (err) {
      console.error("autoEndManager loop error:", err);
    }
  }, 5000);
}
