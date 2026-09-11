import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { raffleStore } from "../raffleStore.js";

export const data = new SlashCommandBuilder()
  .setName("raffle-debug")
  .setDescription("Show internal raffle debug information");

export async function execute(interaction) {
  if (!interaction.memberPermissions.has("Administrator")) {
    return interaction.reply({
      content: "❌ You lack the arcane authority to inspect rituals.",
      ephemeral: true
    });
  }

  const guildId = interaction.guildId;
  const active = raffleStore.getActive(guildId);
  const all = raffleStore.all();

  let activeText = "• None";
  if (active) {
    activeText =
      `• ID: ${active.id}\n` +
      `• Ends At: ${new Date(active.endsAt).toLocaleString()}\n` +
      `• Ended Flag: ${active.ended}\n` +
      `• Entries: ${active.entries?.length ?? 0}`;
  }

  const idsText =
    all.length > 0
      ? all.map(r => `• ${r.id} (ended: ${r.ended})`).join("\n")
      : "None";

  const embed = new EmbedBuilder()
    .setTitle("🔧 Raffle Debug Information")
    .setColor(0x5A00A0)
    .setDescription(
      `**Guild:** ${guildId}\n\n` +
      `**Active Raffle:**\n${activeText}\n\n` +
      `**Total Raffles Stored:** ${all.length}\n\n` +
      `**IDs:**\n${idsText}\n\n` +
      `⟐ Debug complete.`
    );

  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
