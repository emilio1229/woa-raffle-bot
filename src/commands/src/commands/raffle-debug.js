import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { raffleStore } from "../raffleStore.js";

export const data = new SlashCommandBuilder()
  .setName("raffle-debug")
  .setDescription("Show internal raffle debug information (admin only)");

export async function execute(interaction) {
  // Optional: restrict to admins
  if (!interaction.memberPermissions.has("Administrator")) {
    return interaction.reply({
      content: "❌ You lack the arcane authority to inspect rituals.",
      ephemeral: true
    });
  }

  const guildId = interaction.guildId;
  const active = raffleStore.getActive(guildId);
  const all = raffleStore.all();

  const embed = new EmbedBuilder()
    .setTitle("🔧 Raffle Debug Information")
    .setColor(0x5A00A0)
    .setDescription(
      [
        `**Guild:** ${guildId}`,
        ``,
        `**Active Raffle:**`,
        active
          ? `• ID: ${active.id}\n• Ends At: ${new Date(active.endsAt).toLocaleString()}\n• Ended Flag: ${active.ended}\n• Entries: ${active.entries?.length ?? 0}`
          : "• None",
        ``,
        `**Total Raffles Stored:** ${all.length}`,
        ``,
        `**IDs:**`,
        all.map(r => `• ${r.id} (ended: ${r.ended})`).join("\n") || "None",
        ``,
        `⟐ Debug complete.`
      ].join("\n")
    );

  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
