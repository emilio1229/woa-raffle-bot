import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { sigilStore } from '../../sigilStore.js';

const DAY_MS = 24 * 60 * 60 * 1000; // 24 hours

export default {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily sigil reward (+1 sigil).'),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // Load user data
        const userData = sigilStore.getUser(guildId, userId);

        // Initialize lastDaily if missing
        if (!userData.lastDaily) {
            userData.lastDaily = 0;
        }

        const now = Date.now();
        const elapsed = now - userData.lastDaily;

        // Cooldown check
        if (elapsed < DAY_MS) {
            const remaining = DAY_MS - elapsed;

            // Convert remaining time
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

            const cooldownEmbed = new EmbedBuilder()
                .setColor('#ff5555')
                .setTitle('Daily reward not ready yet')
                .setDescription(
                    `You can claim again in **${hours}h ${minutes}m ${seconds}s**.`
                );

            return interaction.reply({
                embeds: [cooldownEmbed],
                ephemeral: true
            });
        }

        // Award +1 sigil (correct function)
        sigilStore.award(guildId, userId, 1, 'Daily reward');

        // Update timestamp
        userData.lastDaily = now;
        sigilStore.persist();

        const successEmbed = new EmbedBuilder()
            .setColor('#55ff55')
            .setTitle('Daily reward claimed')
            .setDescription('You received **+1 sigil**. Come back tomorrow for another reward.');

        return interaction.reply({
            embeds: [successEmbed],
            ephemeral: true
        });
    }
};
