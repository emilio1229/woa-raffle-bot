import { raffleStore } from "./raffleStore.js";
import { sigilStore } from "./sigilStore.js";

function removeEntriesForTransaction(transactionId) {
  let removedCount = 0;

  for (const raffle of raffleStore.all()) {
    const originalLength = raffle.entries.length;
    raffle.entries = raffle.entries.filter(entry => entry.transactionId !== transactionId);

    if (raffle.entries.length !== originalLength) {
      removedCount += originalLength - raffle.entries.length;
      raffleStore.save(raffle);
    }
  }

  return removedCount;
}

function countEntriesForTransaction(transactionId) {
  return raffleStore.all().reduce(
    (count, raffle) => count + raffle.entries.filter(entry => entry.transactionId === transactionId).length,
    0
  );
}

export function reconcilePendingRedemptions() {
  const pendingRedemptions = sigilStore.getPendingRedemptions();

  for (const { guildId, userId, transaction } of pendingRedemptions) {
    const persistedEntryCount = countEntriesForTransaction(transaction.id);

    if (persistedEntryCount === transaction.entryCount) {
      sigilStore.completeRedemption(guildId, userId, transaction.id);
      continue;
    }

    if (persistedEntryCount > 0) {
      removeEntriesForTransaction(transaction.id);
    }

    sigilStore.rollbackTransaction(guildId, userId, transaction.id);
  }
}
