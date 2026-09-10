// src/autoEndmanager.js
import { raffleStore } from "./raffleStore.js";
import { buildRaffleEmbed } from "./embedBuilder.js";
import { EmbedBuilder, AttachmentBuilder } from "discord.js";

export function startAutoEndLoop(client) {
  setInterval(async () => {
    try {
      const raffles = raffleStore.all();

      for (const raffle of raffles) {
        if (Date.now() >= raffle.endsAt) {
          // Determine winner first
          const entries = raffle.entries ?? [];
          let winnerId = null;
          if (entries.length > 0) {
            winnerId = entries[Math.floor(Math.random() * entries.length)];
          }

          // Build the completed raffle embed
          // Mark the raffle as ended for the embed builder
          const endedRaffle = { ...raffle, ended: true };
          const endingEmbed = buildRaffleEmbed(endedRaffle, entries.length, winnerId);

          // Try to update the original raffle message (remove buttons)
          try {
            const channel = await client.channels.fetch(raffle.channelId);
            const msg = await channel.messages.fetch(raffle.messageId).catch(() => null);

            if (msg) {
              await msg.edit({ embeds: [endingEmbed], components: [] });
            }

            // Send a grand announcement (fancier) when there's a winner
            if (winnerId) {
              const winnerTag = `<@${winnerId}>`;

              const grandEmbed = new EmbedBuilder()
                .setColor(0xFF4500)
                .setTitle(`✨ A Champion Has Been Chosen ✨`)
                .setDescription(
                  `The sigil storm erupts in violent cosmic fury.\n\n` +
                    `🔮 **Winner:** ${winnerTag}\n` +
                    `\nThe obelisk cracks open as destiny crowns its new bearer.`
                )
                .setImage("attachment://woa_winner_bg.png")
                .setFooter({ text: "Wizards of Ark • Ascension Complete" })
                .setTimestamp();

              const attachment = new AttachmentBuilder("./assets/woa_winner_bg.png", { name: "woa_winner_bg.png" });

              await channel.send({ embeds: [grandEmbed], files: [attachment] });
            } else {
              // No winner — send a consolation embed
              const noWinnerEmbed = new EmbedBuilder()
                .setColor(0x2F4F4F)
                .setTitle(`Ritual Concluded — No Champion`)
                .setDescription(`The ritual faded into the void; no winner could be chosen.`)
                .setFooter({ text: "Wizards of Ark" })
                .setTimestamp();

              await channel.send({ embeds: [noWinnerEmbed] });
            }
          } catch (err) {
            console.error("autoEndManager announcement failed:", err);
          }

          // Finally remove the raffle from the store
          raffleStore.end(raffle.id);
        }
      }
    } catch (err) {
      console.error("autoEndManager error:", err);
    }
  }, 5000); // check every 5 seconds
}
