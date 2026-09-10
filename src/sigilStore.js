import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const configuredSigilRate = Number.parseInt(process.env.SIGILS_PER_RAFFLE_ENTRY ?? "", 10);
export const SIGILS_PER_RAFFLE_ENTRY = Number.isInteger(configuredSigilRate) && configuredSigilRate > 0
  ? configuredSigilRate
  : 100;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_PATH = path.join(DATA_DIR, "sigils.json");

class SigilStore {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });

      if (!fs.existsSync(DATA_PATH)) {
        return { guilds: {} };
      }

      const raw = fs.readFileSync(DATA_PATH, "utf8");
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : { guilds: {} };
    } catch (err) {
      console.error("Failed to load sigil store:", err);
      return { guilds: {} };
    }
  }

  persist() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(this.data, null, 2));
  }

  ensureGuild(guildId) {
    if (!this.data.guilds[guildId]) {
      this.data.guilds[guildId] = { users: {} };
    }

    return this.data.guilds[guildId];
  }

  ensureUser(guildId, userId) {
    const guild = this.ensureGuild(guildId);

    if (!guild.users[userId]) {
      guild.users[userId] = {
        userId,
        balance: 0,
        transactions: []
      };
    }

    return guild.users[userId];
  }

  recalculateUser(user) {
    let runningBalance = 0;

    for (let index = user.transactions.length - 1; index >= 0; index -= 1) {
      runningBalance += user.transactions[index].amount;
      user.transactions[index].balanceAfter = runningBalance;
    }

    user.balance = runningBalance;
  }

  getUser(guildId, userId) {
    return this.ensureUser(guildId, userId);
  }

  getBalance(guildId, userId) {
    return this.getUser(guildId, userId).balance;
  }

  addTransaction(guildId, userId, amount, reason, metadata = {}) {
    if (!Number.isInteger(amount) || amount === 0) {
      throw new Error("Sigil amount must be a non-zero integer.");
    }

    const user = this.ensureUser(guildId, userId);
    const nextBalance = user.balance + amount;

    if (nextBalance < 0) {
      throw new Error("This user does not have enough sigils for that adjustment.");
    }

    const transaction = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      amount,
      reason,
      balanceAfter: nextBalance,
      ...metadata
    };

    user.balance = nextBalance;
    user.transactions.unshift(transaction);

    this.persist();
    return { user, transaction };
  }

  rollbackTransaction(guildId, userId, transactionId) {
    const user = this.ensureUser(guildId, userId);
    const index = user.transactions.findIndex(transaction => transaction.id === transactionId);

    if (index === -1) {
      return false;
    }

    user.transactions.splice(index, 1);
    this.recalculateUser(user);
    this.persist();
    return true;
  }

  completeRedemption(guildId, userId, transactionId) {
    const user = this.ensureUser(guildId, userId);
    const transaction = user.transactions.find(tx => tx.id === transactionId && tx.type === "redeem");

    if (!transaction) {
      return false;
    }

    transaction.status = "completed";
    transaction.completedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  getPendingRedemptions() {
    const pending = [];

    for (const [guildId, guild] of Object.entries(this.data.guilds)) {
      for (const [userId, user] of Object.entries(guild.users)) {
        for (const transaction of user.transactions) {
          if (transaction.type === "redeem" && transaction.status === "pending") {
            pending.push({ guildId, userId, transaction });
          }
        }
      }
    }

    return pending;
  }

  completeRedemptions(transactionIds) {
    const remaining = new Set(transactionIds);

    if (remaining.size === 0) {
      return 0;
    }

    let completed = 0;

    for (const guild of Object.values(this.data.guilds)) {
      for (const user of Object.values(guild.users)) {
        for (const transaction of user.transactions) {
          if (transaction.type === "redeem" && transaction.status === "pending" && remaining.has(transaction.id)) {
            transaction.status = "completed";
            transaction.completedAt = new Date().toISOString();
            remaining.delete(transaction.id);
            completed += 1;
          }
        }
      }
    }

    if (completed > 0) {
      this.persist();
    }

    return completed;
  }

  award(guildId, userId, amount, reason, actorId) {
    return this.addTransaction(guildId, userId, amount, reason, {
      actorId,
      type: amount > 0 ? "award" : "removal"
    }).user;
  }

  redeem(guildId, userId, entryCount, raffleId, raffleName) {
    if (!Number.isInteger(entryCount) || entryCount <= 0) {
      throw new Error("Entry count must be a positive integer.");
    }

    const sigilCost = entryCount * SIGILS_PER_RAFFLE_ENTRY;
    const result = this.addTransaction(
      guildId,
      userId,
      -sigilCost,
      `Redeemed ${entryCount} raffle ${entryCount === 1 ? "entry" : "entries"} for ${raffleName}`,
      {
        type: "redeem",
        status: "pending",
        raffleId,
        raffleName,
        entryCount,
        sigilCost
      }
    );

    return {
      sigilCost,
      user: result.user,
      transaction: result.transaction
    };
  }

  getTransactions(guildId, userId, limit = 10) {
    return this.getUser(guildId, userId).transactions.slice(0, limit);
  }

  getLeaderboard(guildId, limit = 10) {
    const guild = this.ensureGuild(guildId);

    return Object.values(guild.users)
      .sort((a, b) => b.balance - a.balance || b.transactions.length - a.transactions.length)
      .slice(0, limit);
  }

  getGuildStats(guildId) {
    const guild = this.ensureGuild(guildId);
    const users = Object.values(guild.users);

    let totalAwarded = 0;
    let totalRemoved = 0;
    let totalRedeemed = 0;
    let totalTransactions = 0;

    for (const user of users) {
      totalTransactions += user.transactions.length;

      for (const tx of user.transactions) {
        if (tx.amount > 0) {
          totalAwarded += tx.amount;
        } else {
          totalRemoved += Math.abs(tx.amount);

          if (tx.type === "redeem") {
            totalRedeemed += Math.abs(tx.amount);
          }
        }
      }
    }

    return {
      totalUsers: users.length,
      totalBalance: users.reduce((sum, user) => sum + user.balance, 0),
      totalAwarded,
      totalRemoved,
      totalRedeemed,
      totalTransactions
    };
  }
}

export const sigilStore = new SigilStore();
