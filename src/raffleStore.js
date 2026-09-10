// src/raffleStore.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cloneEntries, getManualBoundUsers, normalizeEntries } from "./raffleEntries.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_PATH = path.join(DATA_DIR, "raffles.json");

function normalizeRaffle(raffle) {
  const normalizedEntries = normalizeEntries(raffle?.entries, raffle?.boundUsers);

  return {
    ...raffle,
    entries: normalizedEntries,
    boundUsers: getManualBoundUsers(normalizedEntries),
    ended: Boolean(raffle?.ended),
    ending: Boolean(raffle?.ending),
    winnerId: typeof raffle?.winnerId === "string" ? raffle.winnerId : null,
    buttonsCleared: Boolean(raffle?.buttonsCleared),
    announcementSent: Boolean(raffle?.announcementSent)
  };
}

class RaffleStore {
  constructor() {
    this.raffles = this.load();
  }

  load() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });

      if (!fs.existsSync(DATA_PATH)) {
        return [];
      }

      const raw = fs.readFileSync(DATA_PATH, "utf8");
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map(normalizeRaffle);
    } catch (err) {
      console.error("Failed to load raffle store:", err);
      return [];
    }
  }

  persist() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(this.raffles, null, 2));
  }

  // Create a new raffle
  create(data) {
    const raffle = normalizeRaffle({
      id: Date.now().toString(),
      ...data
    });

    this.raffles.push(raffle);
    this.persist();
    return raffle;
  }

  // Save updated raffle
  save(updated) {
    const index = this.raffles.findIndex(raffle => raffle.id === updated.id);

    if (index !== -1) {
      this.raffles[index] = normalizeRaffle(updated);
      this.persist();
    }
  }

  markEnding(raffleId) {
    const raffle = this.getById(raffleId);

    if (raffle) {
      raffle.ending = true;
      this.save(raffle);
    }
  }

  // Return ALL raffles (needed for autoEndManager)
  all() {
    return this.raffles;
  }

  // Get raffle by ID
  getById(id) {
    return this.raffles.find(raffle => raffle.id === id);
  }

  // Get raffle ID by message ID
  getIdByMessage(messageId) {
    const raffle = this.raffles.find(entry => entry.messageId === messageId);
    return raffle ? raffle.id : null;
  }

  // Alias (optional)
  getByMessageId(messageId) {
    return this.raffles.find(raffle => raffle.messageId === messageId);
  }

  // Set the message ID after sending the raffle embed
  setMessageId(raffleId, messageId) {
    const raffle = this.getById(raffleId);

    if (raffle) {
      raffle.messageId = messageId;
      this.save(raffle);
    }
  }

  // Get active raffle for a guild
  getActive(guildId) {
    return this.raffles.find(
      raffle => raffle.guildId === guildId && !raffle.ended && !raffle.ending && Date.now() < raffle.endsAt
    );
  }

  replaceEntries(raffleId, entries) {
    const raffle = this.getById(raffleId);

    if (!raffle) {
      return null;
    }

    raffle.entries = cloneEntries(entries);
    raffle.boundUsers = getManualBoundUsers(raffle.entries);
    this.save(raffle);
    return raffle;
  }

  // End raffle (remove from store)
  end(raffleId) {
    const nextRaffles = this.raffles.filter(raffle => raffle.id !== raffleId);

    if (nextRaffles.length !== this.raffles.length) {
      this.raffles = nextRaffles;
      this.persist();
    }
  }
}

export const raffleStore = new RaffleStore();
