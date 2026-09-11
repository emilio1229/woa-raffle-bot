class RaffleStore {
  constructor() {
    this.raffles = [];
    this.debugEnabled = true; // toggle if needed
  }

  debug(msg) {
    if (this.debugEnabled) {
      console.log(`[RAFFLE DEBUG] ${msg}`);
    }
  }

  // Create a new raffle
  create(data) {
    const raffle = {
      id: Date.now().toString(),
      ended: false,
      entries: [],
      ...data
    };

    this.raffles.push(raffle);
    this.debug(`Created raffle ${raffle.id}`);
    return raffle;
  }

  // Save updated raffle
  save(updated) {
    const index = this.raffles.findIndex(r => r.id === updated.id);
    if (index !== -1) {
      this.raffles[index] = updated;
      this.debug(`Saved raffle ${updated.id}`);
    }
  }

  // Mark raffle as ended (soft end)
  markEnded(raffleId) {
    const raffle = this.getById(raffleId);
    if (raffle) {
      raffle.ended = true;
      this.save(raffle);
      this.debug(`Marked raffle ${raffleId} as ended`);
    }
  }

  // Hard delete raffle
  end(raffleId) {
    this.raffles = this.raffles.filter(r => r.id !== raffleId);
    this.debug(`Hard removed raffle ${raffleId}`);
  }

  // Return ALL raffles
  all() {
    return this.raffles;
  }

  // Get raffle by ID
  getById(id) {
    return this.raffles.find(r => r.id === id);
  }

  // Get raffle ID by message ID
  getIdByMessage(messageId) {
    const raffle = this.raffles.find(r => r.messageId === messageId);
    return raffle ? raffle.id : null;
  }

  getByMessageId(messageId) {
    return this.raffles.find(r => r.messageId === messageId);
  }

  // Set the message ID after sending the raffle embed
  setMessageId(raffleId, messageId) {
    const raffle = this.getById(raffleId);
    if (raffle) {
      raffle.messageId = messageId;
      this.save(raffle);
      this.debug(`Set messageId for raffle ${raffleId}`);
    }
  }

  // FIXED: Get active raffle for a guild
  getActive(guildId) {
    const active = this.raffles.find(
      r =>
        r.guildId === guildId &&
        !r.ended &&                // MUST NOT be ended
        Date.now() < r.endsAt     // MUST still be running
    );

    this.debug(
      active
        ? `Active raffle found: ${active.id}`
        : `No active raffle for guild ${guildId}`
    );

    return active;
  }
}

export const raffleStore = new RaffleStore();
