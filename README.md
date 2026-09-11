# WoA Raffle Bot

WoA Raffle Bot is a Discord bot for managing raffles with a sigil economy, user balance tracking, and admin moderation tools.

## Overview

The bot is split into two command groups:

- **User commands** for regular members
- **Admin commands** for server staff and administrators

User commands are limited to the following slash commands:

- `/my-sigils`
- `/sigil-shop`
- `/daily`

All other slash commands are admin-only.

## User Commands

### `/my-sigils`
Shows your current sigil balance and recent activity.

### `/sigil-shop`
Opens the sigil shop so users can browse available raffle-related options.

### `/daily`
Claims the daily reward, if available.

## Admin Commands

Admin commands are restricted to authorized administrators only. These commands are used to manage users, sigils, raffle settings, and bot activity.

Common admin actions include:

- Awarding or removing sigils from users
- Checking a user's sigil balance
- Viewing sigil transaction history
- Viewing sigil leaderboard and guild-wide economy stats
- Managing raffle settings and outcomes

## Installation

### Prerequisites

- Node.js 16+ or newer
- A Discord bot token
- A Discord server where you can invite and test the bot

### Setup

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Create a `.env` file with your bot token and any required settings.
4. Deploy the slash commands.
5. Start the bot.

## Configuration

Set up your environment variables in `.env`.

Example:

```env
TOKEN=your_discord_bot_token_here
SIGILS_PER_RAFFLE_ENTRY=100
```

## Permissions

The bot needs Discord permissions to:

- Register slash commands
- Send messages
- Embed links
- Read message history
- Manage messages when updating raffle content

## Notes

- User commands are for regular users only.
- Admin commands are for staff only.
- Slash commands should be used exactly as shown.

## Support

If something is broken or unclear, open an issue in the repository.
