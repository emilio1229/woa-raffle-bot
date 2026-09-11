# WoA Raffle Bot

<p align="center">
  <img src="https://img.shields.io/badge/Discord-Bot-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord Bot">
  <img src="https://img.shields.io/badge/JavaScript-100%25-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status">
</p>

<p align="center">
  <b>Ritual Raffles • Sigil Economy • Weighted Entries • Admin Ledger</b>
</p>

---

## Overview

WoA Raffle Bot is a Discord bot for managing guild raffles, sigil rewards, and moderator-led ledger actions.
It combines a persistent sigil economy with raffle entry redemption, admin review tools, and automated raffle end handling.

The bot is designed around three command groups:

- **User commands** for everyday members
- **Admin commands** for staff and moderators
- **Raffle commands** for creating, tracking, and ending rituals/raffles

---

## Key Features

### Sigil Economy

- Persistent per-guild sigil balances
- Transaction history for awards, removals, redemptions, and daily claims
- Daily reward command with 24-hour cooldown
- User balance and ledger views
- Admin balance auditing and economy statistics

### Raffle System

- Start raffles with a prize and duration
- Optional raffle naming
- View raffle status
- End raffles manually or automatically
- Weighted sigil redemption into raffle entries
- Winner announcement flow

### Admin Tools

- Award or remove sigils from users
- Inspect user balances
- Inspect transaction logs
- View guild-wide leaderboard and economy summary
- Review active raffle state

### Bot Behavior

- Recursive slash command loading from `src/commands/`
- Global interaction router for commands, buttons, and modals
- Background raffle auto-end loop
- Guild-only protection on user-facing features
- Administrator checks for sensitive actions

---

## Command Reference

## User Commands

These commands are available to regular users inside a server.

### `/my-sigils`
View your current sigil balance and recent ledger activity.

**Details**
- Shows your personal balance
- Displays recent transactions
- Uses the sigil ledger for the current guild
- Guild-only command

### `/sigil-shop`
Redeem sigils for weighted raffle entries.

**Details**
- Lists active raffles in the server
- Displays your current sigil balance
- Opens the shop flow for raffle entry redemption
- Guild-only command

### `/daily`
Claim your daily sigil reward.

**Details**
- Grants `+1 sigil`
- Enforces a 24-hour cooldown per user
- Shows a remaining cooldown timer when unavailable
- Persists the last claim timestamp immediately

---

## Admin Commands

These commands are intended for authorized administrators only.

### `/award-sigils <user> <amount> <reason>`
Award or remove sigils from a user.

**Options**
- `user` — the target member
- `amount` — positive to award, negative to remove
- `reason` — required ledger reason

**Behavior**
- Updates the target user's sigil balance
- Records the action in transaction history
- Logs who performed the adjustment
- Returns an updated balance embed

### `/sigil-balance <user>`
Inspect another user's sigil balance.

**Behavior**
- Displays current balance
- Shows recent transaction activity
- Intended for moderation and support

### `/sigil-transactions <user>`
Inspect a user's transaction history.

**Behavior**
- Shows a longer ledger view
- Useful for auditing adjustments and redemptions
- Administrator-only

### `/sigil-leaderboard`
View the top sigil earners in the guild.

**Behavior**
- Sorts users by balance
- Fetches display names when possible
- Returns a formatted leaderboard embed

### `/sigil-admin-panel`
View guild-wide economy statistics.

**Behavior**
- Summarizes circulation and economy data
- Shows active raffle context
- Provides a moderation overview for the server

---

## Raffle Commands

These commands control raffle creation and resolution.

### `/raffle-start <prize> <duration> [name]`
Start a new raffle.

**Options**
- `prize` — required prize text
- `duration` — required end time or duration input
- `name` — optional custom raffle title

**Behavior**
- Parses a human-readable time value
- Rejects invalid or past durations
- Generates a themed default name if none is provided
- Prompts the user to select a role during setup
- Continues the raffle creation flow interactively

### `/raffle-status`
Show the current raffle status.

**Behavior**
- Displays details for a single active raffle
- Shows a selection menu if multiple raffles are active
- Includes prize, ending time, invocation text, and bound entry count

### `/raffle-end`
Force-end the current raffle.

**Behavior**
- Ends the active raffle manually
- Selects a winner from the entries when available
- Removes interactive components from the original raffle message
- Posts a winner announcement when applicable

---

## How It Works

### Startup Flow

When the bot starts, it:

1. creates a Discord client
2. loads command files recursively from `src/commands/`
3. registers them in memory
4. starts the raffle auto-end loop
5. starts any additional background routines
6. listens for interactions from Discord

### Interaction Routing

The bot uses a central interaction handler for:

- slash commands
- buttons
- modal submissions

This keeps command logic organized while still supporting richer interactive workflows.

### Sigil Ledger

Sigil balances are stored per guild and per user.
The ledger tracks:

- current balance
- transaction history
- daily claim timestamps
- awarded, removed, and redeemed amounts

### Raffle Flow

Raffles can be started, monitored, and ended.
The raffle system supports:

- active raffle tracking
- manual ending
- automatic ending
- entry redemption through the sigil shop
- winner selection based on raffle entries

---

## Installation

### Requirements

- Node.js 16+ or newer
- npm
- a Discord application and bot token
- permission to invite the bot to a server

### Setup

```bash
git clone https://github.com/emilio1229/woa-raffle-bot.git
cd woa-raffle-bot
npm install
```

Create a `.env` file in the project root:

```env
TOKEN=your_discord_bot_token_here
CLIENT_ID=your_application_client_id_here
SIGILS_PER_RAFFLE_ENTRY=100
```

Deploy the slash commands:

```bash
node src/deploy-commands.js
```

Start the bot:

```bash
node src/index.js
```

---

## Configuration

| Variable | Required | Default | Description |
|---|---|---:|---|
| `TOKEN` | Yes | — | Discord bot token |
| `CLIENT_ID` | Yes | — | Discord application client ID |
| `SIGILS_PER_RAFFLE_ENTRY` | No | `100` | Sigil cost per raffle entry |

### Example `.env`

```env
TOKEN=your_discord_bot_token_here
CLIENT_ID=123456789012345678
SIGILS_PER_RAFFLE_ENTRY=100
```

---

## Data Storage

### Sigil Data

The bot uses a persistent sigil ledger to keep balances and transaction history.

Typical information stored includes:

- guild ID
- user ID
- sigil balance
- transaction records
- daily reward timestamp

### Raffle Data

Raffle state includes:

- raffle ID
- guild ID
- channel ID
- message ID
- prize
- end time
- entries
- ended state

---

## Permissions

### OAuth2 Scopes

- `applications.commands` — registers slash commands
- `bot` — adds the bot to the server

### Bot Permissions

- `SEND_MESSAGES` — reply to commands
- `MANAGE_MESSAGES` — update raffle content and remove components
- `EMBED_LINKS` — send rich embeds
- `READ_MESSAGE_HISTORY` — fetch existing raffle messages

### Command Restrictions

- user commands are guild-only
- admin commands require administrator privileges
- raffle management should be used only by trusted staff

---

## Troubleshooting

### Commands do not appear

Check that:

- the bot was invited with `applications.commands`
- slash commands were deployed successfully
- the bot has permission to view the server and channels
- the correct application `CLIENT_ID` is set

### `/my-sigils` or `/sigil-shop` does not work in DMs

That is expected.
These commands are intentionally server-only.

### Daily reward says it is still on cooldown

The command can only be used once every 24 hours.
Wait until the displayed cooldown expires.

### Raffle creation fails

Possible causes:

- invalid duration format
- end time in the past
- missing permissions
- setup interaction timed out

### Admin command fails

Verify that:

- you have administrator permissions
- you are using the command in a server
- the bot can reply in the channel

---

## Contributing

Contributions are welcome.
If you add new slash commands under `src/commands/`, they will be discovered automatically by the recursive loader.

---

## License

Unlicensed. Use freely.

---

## Support

If you need help, open an issue in the repository or contact the maintainer.
