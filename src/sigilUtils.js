import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField
} from "discord.js";
import { SIGILS_PER_RAFFLE_ENTRY } from "./sigilStore.js";

const COLORS = {
  purple: 0x6A0DAD,
  gold: 0xD4AF37,
  green: 0x2ECC71,
  ember: 0xC0392B
};

// -----------------------------
// Admin Helpers
// -----------------------------
export function isAdmin(interaction) {
  return interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator) ?? false;
}

export async function requireAdmin(interaction) {
  if (isAdmin(interaction)) return true;

  await interaction.reply({
    content: "❌ Only server administrators may wield this sigil rite.",
    flags: 64
  });
  return false;
}

// -----------------------------
// Formatting Helpers
// -----------------------------
export function formatSigilAmount(amount) {
  return `${amount > 0 ? "+" : ""}${amount}`;
}

export function formatTransaction(tx) {
  return [
    `• <t:${Math.floor(new Date(tx.timestamp).getTime() / 1000)}:f>`,
    ` ${formatSigilAmount(tx.amount)} sigils`,
    ` — ${tx.reason}`,
    ` *(Balance: ${tx.balanceAfter})*`
  ].join("");
}

// -----------------------------
// /my-sigils Embed (NEW VERSION)
// -----------------------------
export function buildBalanceEmbed(user, balance, transactions, title, subtitle) {
  const recent =
    transactions.length > 0
      ? transactions.map(formatTransaction).join("\n")
      : "No movements echo through your sigil ledger.";

  return new EmbedBuilder()
    .setColor(COLORS.purple)
    .setTitle(title)
    .setDescription(subtitle)
    .addFields(
      {
        name: "💠 Sigil Balance",
        value: `You currently hold **${balance} sigils**.`,
        inline: false
      },
      {
        name: "📜 Ledger Echoes (last 10)",
        value: recent,
        inline: false
      },
      {
        name: "🜂 Ledger Summary",
        value: [
          `• **Earned:** ${transactions
            .filter(t => t.amount > 0)
            .reduce((a, b) => a + b.amount, 0)}`,
          `• **Spent / Removed:** ${transactions
            .filter(t => t.amount < 0)
            .reduce((a, b) => a + Math.abs(b.amount), 0)}`,
          `• **Current Balance:** ${balance}`
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: `Sigil bearer: ${user.tag}` })
    .setTimestamp();
}

// -----------------------------
// Leaderboard Embed
// -----------------------------
export function buildLeaderboardEmbed(entries) {
  return new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle("🏆 Sigil Leaderboard")
    .setDescription(
      entries.length > 0
        ? entries.join("\n")
        : "No sigils have been awarded in this realm yet."
    )
    .setFooter({ text: "Top 10 sigil earners in this guild" })
    .setTimestamp();
}

// -----------------------------
// Admin Panel Embed
// -----------------------------
export function buildAdminPanelEmbed(stats, activeRaffles) {
  return new EmbedBuilder()
    .setColor(COLORS.green)
    .setTitle("🧿 Sigil Admin Panel")
    .setDescription("Mystic economy overview for administrators.")
    .addFields(
      { name: "👥 Sigil Bearers", value: `${stats.totalUsers}`, inline: true },
      { name: "💠 Sigils in Circulation", value: `${stats.totalBalance}`, inline: true },
      { name: "🎟️ Exchange Rate", value: `${SIGILS_PER_RAFFLE_ENTRY} sigils = 1 raffle entry`, inline: true },
      { name: "✨ Total Awarded", value: `${stats.totalAwarded}`, inline: true },
      { name: "🜂 Total Removed", value: `${stats.totalRemoved}`, inline: true },
      { name: "🎫 Redeemed into Entries", value: `${stats.totalRedeemed}`, inline: true },
      { name: "📚 Ledger Entries", value: `${stats.totalTransactions}`, inline: true },
      { name: "🔮 Active Raffles", value: `${activeRaffles.length}`, inline: true },
      {
        name: "🗂️ Open Rituals",
        value: activeRaffles.length > 0
          ? activeRaffles
              .slice(0, 10)
              .map(raffle => `• ${raffle.name} — \`${raffle.id}\` — ends <t:${Math.floor(raffle.endsAt / 1000)}:R>`)
              .join("\n")
          : "No active raffles right now.",
        inline: false
      }
    )
    .setTimestamp();
}

// -----------------------------
// Sigil Shop Embed
// -----------------------------
export function buildShopEmbed(activeRaffles, balance) {
  return new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle("🛍️ Sigil Shop")
    .setDescription(
      [
        `Trade your hard-earned sigils for weighted raffle entries.`,
        `Exchange rate: **${SIGILS_PER_RAFFLE_ENTRY} sigils = 1 raffle entry**.`,
        `Current balance: **${balance} sigils**.`
      ].join("\n")
    )
    .addFields({
      name: "🔮 Active Rituals",
      value: activeRaffles.length > 0
        ? activeRaffles
            .map(raffle => `• **${raffle.name}** — Prize: ${raffle.prize}\n  ID: \`${raffle.id}\` • Ends <t:${Math.floor(raffle.endsAt / 1000)}:R>`)
            .join("\n")
        : "No active raffles are available for redemption right now.",
      inline: false
    })
    .setFooter({ text: "Press the button below to open the redemption modal." })
    .setTimestamp();
}

// -----------------------------
// Shop Components
// -----------------------------
export function buildShopComponents(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("sigil_shop_open")
        .setLabel("Redeem Sigils")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled)
    )
  ];
}

// -----------------------------
// Redeem Success Embed
// -----------------------------
export function buildRedeemSuccessEmbed(raffle, entryCount, sigilCost, balance) {
  return new EmbedBuilder()
    .setColor(COLORS.green)
    .setTitle("✨ Sigils Redeemed")
    .setDescription("The raffle circle accepts your sigil offering.")
    .addFields(
      { name: "🔮 Ritual", value: `${raffle.name}`, inline: false },
      { name: "🎫 Entries Added", value: `${entryCount}`, inline: true },
      { name: "💠 Sigils Spent", value: `${sigilCost}`, inline: true },
      { name: "🪙 Remaining Balance", value: `${balance}`, inline: true }
    )
    .setTimestamp();
}
