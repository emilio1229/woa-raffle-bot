# WoA Raffle Bot

A Discord bot for managing guild raffles with persistent sigil economy, admin controls, and weighted entry redemption.

## Features

### 🎰 Raffle Management
- Create raffles with customizable names, prizes, and end times
- Track raffle entries and display active raffles with rich embeds
- Auto-end raffles when the timer expires
- Manual bind/unbind for single-entry participation

### 💰 Sigil Economy
- **Persistent ledger** backed by JSON storage (`data/sigils.json`)
- Per-guild, per-user balance tracking with full transaction history
- Configurable exchange rate: `SIGILS_PER_RAFFLE_ENTRY` (default: 100 sigils per entry)
- Automatic rollback support for failed transactions

### 👑 Admin Commands
- `/award-sigils @user <amount> <reason>` — Award bounty rewards or bonuses
- `/sigil-balance @user` — Check user's sigil balance
- `/sigil-leaderboard` — View top sigil holders in the guild
- `/sigil-transactions @user` — Audit user transaction history
- `/sigil-admin-panel` — Guild overview (circulation, awarded totals, redemption stats)

### 👥 User Commands
- `/my-sigils` — View your balance and recent transactions
- `/sigil-shop` — Browse active raffles and redeem sigils for entries
- Bind/Unbind buttons — Single manual entry participation

### 🔐 Consistency & Safety
- Per-raffle locking prevents concurrent redemption race conditions
- Transaction rollback if raffle display fails to update
- Guild-only guards on all sensitive commands and interactions
- No partial purchases — sigils and entries are always in sync

---

## Installation

### Prerequisites
- Node.js 16+ (ES modules support)
- A Discord bot token (create one at [Discord Developer Portal](https://discord.com/developers/applications))

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/emilio1229/woa-raffle-bot.git
   cd woa-raffle-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```env
   TOKEN=your_discord_bot_token_here
   SIGILS_PER_RAFFLE_ENTRY=100
   ```

4. **Deploy slash commands**
   ```bash
   node src/deploy-commands.js
   ```

5. **Start the bot**
   ```bash
   node src/index.js
   ```

---

## Configuration

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `TOKEN` | required | Discord bot token |
| `SIGILS_PER_RAFFLE_ENTRY` | 100 | Cost in sigils per raffle entry (must be positive integer) |

### Data Storage
- **Sigils:** `data/sigils.json` (auto-created, gitignored)
- **Raffles:** `data/raffles.json` (auto-created, gitignored)
- Both files are human-readable JSON with automatic backups on every update

---

## Usage Examples

### Admin Awards Sigils
```
/award-sigils @john 500 "Weekly bounty completion"
```
John's balance increases by 500 sigils. Transaction is logged with admin info and timestamp.

### User Checks Balance
```
/my-sigils
```
Displays user's current balance and last 10 transactions (awards, removals, redemptions).

### User Redeems for Raffle Entries
```
/sigil-shop
```
Shows all active raffles. User clicks a raffle button → enters redemption modal → confirms entry count → sigils deducted, raffle entries added.

Example: Redeeming 3 entries at 100 sigils/entry = 300 sigils cost.

### Admin Views Guild Stats
```
/sigil-admin-panel
```
Summary:
- Total circulation (all sigils held by users)
- Total awarded & removed
- Total redeemed for raffles
- Transaction volume
- Active raffles

---

## Data Structure

### Sigil Ledger (`data/sigils.json`)
```json
{
  "guilds": {
    "guild-id": {
      "users": {
        "user-id": {
          "userId": "user-id",
          "balance": 450,
          "transactions": [
            {
              "id": "timestamp-random",
              "timestamp": "2026-09-10T16:10:25.123Z",
              "amount": -300,
              "reason": "Redeemed 3 raffle entries for Weekly Jackpot",
              "balanceAfter": 450,
              "type": "redeem",
              "raffleId": "raffle-id",
              "raffleName": "Weekly Jackpot",
              "entryCount": 3,
              "sigilCost": 300
            }
          ]
        }
      }
    }
  }
}
```

### Key Fields
- **amount:** Positive for awards, negative for redemptions/removals
- **balanceAfter:** User's balance after this transaction (for reconciliation)
- **type:** `"award"`, `"removal"`, or `"redeem"`
- **transactionId:** Used for rollback if message update fails

---

## Architecture

### Core Modules
- **`sigilStore.js`** — Persistent sigil ledger with transactions, awards, redemptions, and rollback
- **`raffleStore.js`** — Raffle creation, tracking, and persistence
- **`raffleEntryLock.js`** — Per-raffle mutex to prevent concurrent redemption race conditions
- **`interactionCreate.js`** — Centralized handler for buttons, modals, and slash commands
- **`embedBuilder.js`** — Rich embed templates for raffles, transactions, and admin panels
- **`commands/`** — Modular slash commands (admin, user, raffle)
- **`buttons/`** — Button handlers (bind, unbind, sigil redemption)

### Command Discovery
Commands are loaded recursively from `src/commands/` at startup and deployment. Add new commands in any subdirectory under `src/commands/` and they'll auto-register.

---

## Troubleshooting

### Bot doesn't respond to commands
- Check bot has `applications.commands` scope in Discord Developer Portal
- Run `node src/deploy-commands.js` again to register commands
- Ensure bot has proper guild permissions

### Sigil balance not persisting
- Check `data/sigils.json` exists and is readable
- Verify bot has write permissions in the application directory
- Check console for "Failed to load sigil store" errors

### Raffle message fails to update
- Bot may lack `MANAGE_MESSAGES` permission
- Raffle message may have been deleted; create a new raffle
- Channel permissions may be restricted

### Exchange rate producing NaN
- Ensure `SIGILS_PER_RAFFLE_ENTRY` is set to a positive integer
- Invalid values (0, negative, non-numeric) will default to 100

---

## Contributing

Feel free to open issues for bugs or feature requests. PRs are welcome!

---

## License

Unlicensed. Use freely.

---

## Bot Permissions

Invite the bot with the following scopes:
- `applications.commands` (register slash commands)
- `bot` (general bot permissions)

Required permissions:
- `SEND_MESSAGES` — Reply to commands
- `MANAGE_MESSAGES` — Update raffle embeds
- `EMBED_LINKS` — Send rich embeds
- `READ_MESSAGE_HISTORY` — Fetch raffle messages

---

## Support

For issues or questions, open a GitHub issue or contact the maintainer.
