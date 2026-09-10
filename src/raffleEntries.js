function cloneEntry(entry) {
  return {
    userId: entry.userId,
    source: entry.source,
    transactionId: entry.transactionId
  };
}

export function normalizeEntries(entries = [], boundUsers = []) {
  const manualCounts = new Map();

  for (const userId of boundUsers) {
    manualCounts.set(userId, (manualCounts.get(userId) ?? 0) + 1);
  }

  return entries
    .map(entry => {
      if (typeof entry === "string") {
        const source = (manualCounts.get(entry) ?? 0) > 0 ? "manual" : "redeem";

        if (source === "manual") {
          manualCounts.set(entry, manualCounts.get(entry) - 1);
        }

        return { userId: entry, source };
      }

      if (!entry || typeof entry !== "object" || typeof entry.userId !== "string") {
        return null;
      }

      return {
        userId: entry.userId,
        source: entry.source === "manual" ? "manual" : "redeem",
        transactionId: typeof entry.transactionId === "string" ? entry.transactionId : undefined
      };
    })
    .filter(Boolean);
}

export function cloneEntries(entries = []) {
  return normalizeEntries(entries).map(cloneEntry);
}

export function createManualEntry(userId) {
  return { userId, source: "manual" };
}

export function createRedeemedEntries(userId, entryCount, transactionId) {
  return Array.from({ length: entryCount }, () => ({
    userId,
    source: "redeem",
    transactionId
  }));
}

export function countEntriesForUser(entries, userId) {
  return normalizeEntries(entries).filter(entry => entry.userId === userId).length;
}

export function removeManualEntry(entries, userId) {
  const normalized = normalizeEntries(entries);
  const index = normalized.findIndex(entry => entry.userId === userId && entry.source === "manual");

  if (index === -1) {
    return { removed: false, entries: normalized };
  }

  normalized.splice(index, 1);
  return { removed: true, entries: normalized };
}

export function pickWinnerId(entries) {
  const normalized = normalizeEntries(entries);

  if (normalized.length === 0) {
    return null;
  }

  return normalized[Math.floor(Math.random() * normalized.length)].userId;
}

export function getManualBoundUsers(entries) {
  return [...new Set(
    normalizeEntries(entries)
      .filter(entry => entry.source === "manual")
      .map(entry => entry.userId)
  )];
}
