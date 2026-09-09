// src/raffleStore.js
import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "raffles.json");

function read() {
  try {
    const raw = fs.readFileSync(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function write(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const raffleStore = {
  all() {
    return read();
  },

  create(partial) {
    const data = read();
    const id = Date.now().toString();

    const raffle = {
      id,
      guildId: partial.guildId,
      channelId: partial.channelId,
      messageId: partial.messageId ?? null,

      // --- RITUAL SYSTEM ADDITIONS ---
      tagRole: partial.tagRole ?? null,          // The role invoked in the ritual
      wizardPhrase: partial.wizardPhrase ?? "", // The incantation used
      ritualType: partial.ritualType ?? "soul-binding", // Future expansion

      // --- EXISTING FIELDS ---
      prize: partial.prize,
      endsAt: partial.endsAt,
      entries: partial.entries ?? [],
      ended: partial.ended ?? false
    };

    data.push(raffle);
    write(data);
    return raffle;
  },

  update(id, patch) {
    const data = read();
    const idx = data.findIndex(r => r.id === id);
    if (idx === -1) return null;

    data[idx] = { ...data[idx], ...patch };
    write(data);
    return data[idx];
  },

  setMessageId(id, messageId) {
    return this.update(id, { messageId });
  },

  markEnded(id) {
    return this.update(id, { ended: true });
  },

  findByMessageId(messageId) {
    return read().find(r => r.messageId === messageId);
  },

  findById(id) {
    return read().find(r => r.id === id);
  },

  activeInGuild(guildId) {
    return read().filter(r => r.guildId === guildId && !r.ended);
  },

  addEntry(id, userId) {
    const raffle = this.findById(id);
    if (!raffle) return null;

    if (!raffle.entries.includes(userId)) {
      raffle.entries.push(userId);
      this.update(id, { entries: raffle.entries });
    }
    return raffle;
  },

  removeEntry(id, userId) {
    const raffle = this.findById(id);
    if (!raffle) return null;

    raffle.entries = raffle.entries.filter(u => u !== userId);
    this.update(id, { entries: raffle.entries });
    return raffle;
  }
};
