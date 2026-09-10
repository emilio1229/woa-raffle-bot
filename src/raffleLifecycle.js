import path from "path";
import { fileURLToPath } from "url";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { withRaffleEntryLock } from "./raffleEntryLock.js";
import { pickWinnerId } from "./raffleEntries.js";
import { raffleStore } from "./raffleStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSET_PATH = path.join(__dirname, "..", "assets", "woa_winner_bg.png");

async function clearRaffleButtons(client, raffle) {
  if (!raffle.channelId || !raffle.messageId) {
    return true;
  }

  const channel = await client.channels.fetch(raffle.channelId).catch(() => null);
  if (!channel) {
    return false;
  }

  const message = await channel.messages.fetch(raffle.messageId).catch(() => null);
  if (!message) {
    return true;
  }

  await message.edit({ components: [] });
  return true;
}

async function sendRaffleAnnouncement(client, raffle, winnerId, entryCount) {
  const channel = await client.channels.fetch(raffle.channelId).catch(() => null);
  if (!channel) {
    return false;
  }

  if (winnerId) {
    const grandEmbed = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle("✨ A Champion Has Been Chosen ✨")
      .setDescription("The sigil storm erupts in violent cosmic fury.")
      .addFields(
        { name: "👑 Winner", value: `<@${winnerId}>`, inline: false },
        { name: "📢 Ritual Role", value: raffle.tagRole ? `<@&${raffle.tagRole}>` : "None", inline: false },
        { name: "🎁 Prize", value: `**${raffle.prize}**`, inline: false },
        { name: "💠 Sigils Bound", value: `${entryCount}`, inline: true }
      )
      .setImage("attachment://woa_winner_bg.png")
      .setFooter({ text: "Wizards of Ark • Ascension Complete" })
      .setTimestamp();

    const attachment = new AttachmentBuilder(ASSET_PATH, { name: "woa_winner_bg.png" });
    await channel.send({
      embeds: [grandEmbed],
      files: [attachment],
      allowedMentions: {
        users: [winnerId],
        roles: raffle.tagRole ? [raffle.tagRole] : []
      }
    });
    return true;
  }

  const noWinnerEmbed = new EmbedBuilder()
    .setColor(0x2F4F4F)
    .setTitle("Ritual Concluded — No Champion")
    .setDescription("The ritual faded into the void; no winner could be chosen.")
    .setFooter({ text: "Wizards of Ark" })
    .setTimestamp();

  await channel.send({ embeds: [noWinnerEmbed] });
  return true;
}

export async function concludeRaffle(client, raffleId) {
  return withRaffleEntryLock(raffleId, async () => {
    const raffle = raffleStore.getById(raffleId);

    if (!raffle) {
      return { status: "missing" };
    }

    if (raffle.ended) {
      raffleStore.end(raffleId);
      return { status: "already-ended", raffle };
    }

    if (!raffle.ending) {
      raffle.ending = true;
      raffle.winnerId = pickWinnerId(raffle.entries ?? []);
      raffle.buttonsCleared = false;
      raffle.announcementSent = false;
      raffleStore.save(raffle);
    }

    const updated = raffleStore.getById(raffleId);
    const entries = updated?.entries ?? [];
    const winnerId = updated?.winnerId ?? null;
    const entryCount = entries.length;

    if (!updated.buttonsCleared) {
      try {
        updated.buttonsCleared = await clearRaffleButtons(client, updated);
        if (updated.buttonsCleared) {
          raffleStore.save(updated);
        }
      } catch (err) {
        console.error("Failed to clear raffle buttons:", err);
      }
    }

    if (!updated.announcementSent) {
      try {
        updated.announcementSent = await sendRaffleAnnouncement(client, updated, winnerId, entryCount);
        if (updated.announcementSent) {
          raffleStore.save(updated);
        }
      } catch (err) {
        console.error("Failed to send raffle announcement:", err);
      }
    }

    if (!updated.buttonsCleared || !updated.announcementSent) {
      return {
        status: "ending",
        raffle: updated,
        winnerId,
        entryCount,
        announced: updated.announcementSent
      };
    }

    updated.ending = false;
    updated.ended = true;
    raffleStore.save(updated);

    raffleStore.end(raffleId);

    return {
      status: "ended",
      raffle: updated,
      winnerId,
      entryCount,
      announced: updated.announcementSent
    };
  });
}
