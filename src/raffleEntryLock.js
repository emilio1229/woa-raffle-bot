const raffleEntryLocks = new Map();

export async function withRaffleEntryLock(raffleId, callback) {
  const previous = raffleEntryLocks.get(raffleId) ?? Promise.resolve();
  let release;
  const current = new Promise(resolve => {
    release = resolve;
  });

  raffleEntryLocks.set(raffleId, current);
  await previous;

  try {
    return await callback();
  } finally {
    release();

    if (raffleEntryLocks.get(raffleId) === current) {
      raffleEntryLocks.delete(raffleId);
    }
  }
}
