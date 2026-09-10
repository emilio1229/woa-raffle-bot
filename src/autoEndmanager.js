// src/autoEndmanager.js
import { fileURLToPath } from "url";
import path from "path";
import { raffleStore } from "./raffleStore.js";
import { buildRaffleEndedEmbed } from "./embedBuilder.js";
import { EmbedBuilder, AttachmentBuilder } from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSET_PATH = path.join(__dirname, "..", "assets", "woa_winner_bg.png");

export function startAutoEndLoop(client) {
  setInterval(async () => {
    try {
      const raffles = raffleStore.all();

      for (const raffle of raffles) {
        if (Date.now() >= raffle.endsAt) {
          console.log(`[autoEndManager] Ending raffle ${raffle.id} (guild=${raffle.guildId})`);

          const entries = raffle.entries ?? [];
          let winnerId = null;
          if (entries.length > 0) {
            winnerId = entries[Math.floor(Math.random() * entries.length)];
            console.log(`[autoEndManager] Chosen winner: ${winnerId}`);
          } else {
            console.log(`[autoEndManager] No entries for raffle ${raffle.id}`);
          }

          // Build completed embed (separate from active embed)
          const endingEmbed = buildRaffleEndedEmbed(raffle, entries.length, winnerId);

          // Try to update the original raffle message (remove buttons)
          try {
            if (raffle.channelId && raffle.messageId) {
              const channel = await client.channels.fetch(raffle.channelId).catch(e => {
                console.error(`[autoEndManager] failed to fetch channel ${raffle.channelId}:`, e);
                return null;
              });

              if (channel) {
                const msg = await channel.messages.fetch(raffle.messageId).catch(e => {
                  console.warn(`[autoEndManager] could not fetch message ${raffle.messageId}:`, e);
                  return null;
                });

                if (msg) {
                  await msg.edit({ embeds: [endingEmbed], components: [] }).catch(e => {
                    console.error("[autoEndManager] failed to edit original raffle message:", e);
                  });
                }
              }
            } else {
              console.warn(`[autoEndManager] raffle ${raffle.id} missing channelId/messageId`);
            }
          } catch (err) {
            console.error("autoEndManager announcement (edit) failed:", err);
          }

          // Send grand announcement
          try {
            const destChannel = await client.channels.fetch(raffle.channelId).catch(e => {
              console.error(`[autoEndManager] failed to fetch channel for announcement ${raffle.channelId}:`, e);
              return null;
            });

            if (!destChannel) {
              console.warn("[autoEndManager] destination channel not available, skipping announcement.");
            } else if (winnerId) {
              const winnerTag = `<@${winnerId}>`;
              const roleTag = raffle.tagRole ? ` <@&${raffle.tagRole}>` : "";

              const grandEmbed = new EmbedBuilder()
                .setColor(0xFF4500)
                .setTitle("✨ A Champion Has Been Chosen ✨")
                .setDescription(
                  `The sigil storm erupts in violent cosmic fury.\n\n🔮 **Winner:** ${winnerTag}${roleTag}\n\nThe obelisk cracks open as destiny crowns its new bearer.`
                )
                .setImage("attachment://woa_winner_bg.png")
                .setFooter({ text: "Wizards of Ark • Ascension Complete" })
                .setTimestamp();

              const attachment = new AttachmentBuilder(ASSET_PATH, { name: "woa_winner_bg.png" });
              await destChannel.send({ embeds: [grandEmbed], files: [attachment] });
              console.log(`[autoEndManager] sent grand announcement for raffle ${raffle.id}`);
            } else {
              const noWinnerEmbed = new EmbedBuilder()
                .setColor(0x2F4F4F)
                .setTitle("Ritual Concluded — No Champion")
                .setDescription("The ritual faded into the void; no winner could be chosen.")
                .setFooter({ text: "Wizards of Ark" })
                .setTimestamp();

              await destChannel.send({ embeds: [noWinnerEmbed] });
              console.log(`[autoEndManager] sent no-winner announcement for raffle ${raffle.id}`);
            }
          } catch (err) {
            console.error("autoEndManager announcement (send) failed:", err);
          }

          // Finally remove the raffle from the store
          try {
            raffleStore.end(raffle.id);
            console.log(`[autoEndManager] raffle ${raffle.id} removed from store`);
          } catch (err) {
            console.error("[autoEndManager] failed to remove raffle from store:", err);
          }
        }
      }
    } catch (err) {
      console.error("autoEndManager loop error:", err);
    }
  }, 5000);
}
