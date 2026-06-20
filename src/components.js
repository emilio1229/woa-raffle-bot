// src/components.js
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} from "discord.js";

export function buildRaffleButtons(raffleId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`enter_${raffleId}`)
      .setLabel("Bind Soul")
      .setEmoji("🪄")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`leave_${raffleId}`)
      .setLabel("Unbind Soul")
      .setEmoji("💀")
      .setStyle(ButtonStyle.Danger)
  );
}

export function buildRaffleSelectMenu(raffles, customId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder("Choose a raffle…");

  for (const r of raffles) {
    menu.addOptions({
      label: r.prize,
      description: `Ends: ${new Date(r.endsAt).toLocaleString()}`,
      value: r.id
    });
  }

  return new ActionRowBuilder().addComponents(menu);
}
