// src/raffleStore.js

class RaffleStore {
  constructor() {
    this.raffles = [];
  }

  // Create a new raffle
  create(data) {
    const raffle = {
      id: Date.now().toString(), // unique ID
      ...data
    };

    this.raffles.push(raffle);
    return raffle;
  }

  // Save updated raffle
  save(updated) {
    const index = this.raffles.findIndex(r => r.id === updated.id);
    if (index !== -1) {
      this.raffles[index] = updated;
    }
  }

  // Mark raffle as ended (without removing it)
  markEnded(raffleId) {
    const raffle = this.getById(raffleId);
    if (raffle) {
      raffle.ended = true;
      this.save(raffle);
    }
  }

  // Return ALL raffles (needed for autoEndManager)
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

  // Alias (optional)
  getByMessageId(messageId) {
    return this.raffles.find(r => r.messageId === messageId);
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
      r => r.guildId === guildId && Date.now() < r.endsAt
    );
  }

  // End raffle (remove from store)
  end(raffleId) {
    this.raffles = this.raffles.filter(r => r.id !== raffleId);
  }
}

export const raffleStore = new RaffleStore();
