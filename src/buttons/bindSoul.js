import { EmbedBuilder } from "discord.js";
import { buildActiveRaffleEmbed } from "../embedBuilder.js";
import { withRaffleEntryLock } from "../raffleEntryLock.js";
import { raffleStore } from "../raffleStore.js";

function countEntriesForUser(entries, userId) {
  return entries.filter(id => id === userId).length;
}

export async function handleBindSoul(interaction, raffleId) {
  return withRaffleEntryLock(raffleId, async () => {
    const raffle = raffleStore.getById(raffleId);

    if (!raffle || raffle.ended) {
      try {
        return await interaction.reply({
          content: "❌ This ritual has already ended.",
          flags: 64
        });
      } catch (err) {
        if (err.code === 10062) {
          await interaction.channel.send(
            `<@${interaction.user.id}> ❌ This ritual has already ended.`
          );
          return;
        }
        throw err;
      }
    }

    const userId = interaction.user.id;
    raffle.boundUsers ??= [];
    raffle.entries ??= [];

    // 🔮 Prevent double join — with safe fallback
    if (raffle.boundUsers.includes(userId)) {
      try {
        return await interaction.reply({
          content: "🔮 You have already joined this ritual.",
          flags: 64
        });
      } catch (err) {
        if (err.code === 10062) {
          console.log("[bindSoul] Interaction expired for double-join message");
          await interaction.channel.send(
            `<@${interaction.user.id}> 🔮 You have already joined this ritual.`
          );
          return;
        }
        throw err;
      }
    }

    // ⚠️ Safe deferReply — prevents Unknown Interaction crash
    let canReply = true;
    try {
      await interaction.deferReply({ ephemeral: true });
    } catch (err) {
      if (err.code === 10062) {
        console.log("[bindSoul] Interaction expired during deferReply");
        canReply = false; // We will use fallback messaging
      } else {
        throw err;
      }
    }

    // Save original state in case embed update fails
    const originalEntries = [...raffle.entries];
    const originalBoundUsers = [...raffle.boundUsers];

    // Add user
    raffle.boundUsers.push(userId);
    raffle.entries.push(userId);

    // Try updating the main raffle message
    try {
      const channel = await interaction.client.channels.fetch(raffle.channelId);
      const msg = await channel.messages.fetch(raffle.messageId);

      await msg.edit({
        embeds: [buildActiveRaffleEmbed(raffle)],
        components: msg.components,
        files: ["./assets/woa_ritual_bg.png"]
      });
    } catch (err) {
      // Rollback if embed update fails
      raffle.entries = originalEntries;
      raffle.boundUsers = originalBoundUsers;

      if (canReply) {
        return interaction.editReply({
          content: "❌ The ritual could not be updated. You were not joined.",
          flags: 64
        });
      } else {
        await interaction.channel.send(
          `<@${interaction.user.id}> ❌ The ritual could not be updated. You were not joined.`
        );
        return;
      }
    }

    // Save updated raffle
    raffleStore.save(raffle);

    // Build the ephemeral confirmation embed
    const glow = ["🔮✨", "🔮💫", "🔮🌌", "🔮⚡"];
    const glowSymbol = glow[Math.floor(Math.random() * glow.length)];

    const embed = new EmbedBuilder()
      .setTitle(`${glowSymbol} Ritual Joined`)
      .setDescription(
        [
          `You step into the ritual circle.`,
          `Arcane energies acknowledge your presence.`,
          ``,
          `💠 **Your Total Entries:** ${countEntriesForUser(raffle.entries, userId)}`,
          `💠 **Total Participants:** ${raffle.entries.length}`,
          ``,
          `⟐ The ritual deepens with your arrival.`
        ].join("\n")
      )
      .setColor(0x5A00A0)
      .setFooter({ text: "The ritual intensifies…" });

    // Safe final reply
    try {
      if (canReply) {
        return await interaction.editReply({
          embeds: [embed],
          flags: 64
        });
      } else {
        await interaction.channel.send(
          `<@${interaction.user.id}> 🔮 Your essence has been bound to the ritual.`
        );
        return;
      }
    } catch (err) {
      if (err.code === 10062) {
        console.log("[bindSoul] Interaction expired during editReply");
        await interaction.channel.send(
          `<@${interaction.user.id}> 🔮 Your essence has been bound to the ritual.`
        );
        return;
      }
      throw err;
    }
  });
}
