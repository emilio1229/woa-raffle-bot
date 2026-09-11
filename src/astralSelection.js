import { EmbedBuilder } from 'discord.js';
import { sigilStore } from './sigilStore.js';


const INTERVAL_HOURS = 6; // change this to whatever you want
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;

export function startAstralSelection(client) {
    console.log(`[AstralSelection] Started — runs every ${INTERVAL_HOURS} hours.`);

    setInterval(async () => {
        try {
            // Get all guilds the bot is in
            for (const [guildId, guild] of client.guilds.cache) {

                // Get all users with sigil data
                const users = sigilStore.getGuildUsers(guildId);
                const userIds = Object.keys(users);

                if (userIds.length === 0) continue;

                // Pick random user
                const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];

                // Award random sigils (1–3)
                const amount = Math.floor(Math.random() * 3) + 1;
                sigilStore.awardSigils(guildId, randomUserId, amount, 'Astral Selection');
                sigilStore.save();

                // Fetch user object
                const member = await guild.members.fetch(randomUserId).catch(() => null);
                if (!member) continue;

                // Announcement channel (set this to your raffle channel)
                const channelId = process.env.ASTRAL_CHANNEL_ID;
                const channel = guild.channels.cache.get(channelId);
                if (!channel) continue;

                // Build announcement embed
                const embed = new EmbedBuilder()
                    .setColor('#5599ff')
                    .setTitle('Astral Selection')
                    .setDescription(
                        `${member} has been chosen by the astral currents and received **${amount} sigils**.`
                    );

                // Send announcement
                channel.send({ embeds: [embed] });

                console.log(`[AstralSelection] Awarded ${amount} sigils to ${randomUserId}`);
            }
        } catch (err) {
            console.error('[AstralSelection] Error:', err);
        }
    }, INTERVAL_MS);
}
