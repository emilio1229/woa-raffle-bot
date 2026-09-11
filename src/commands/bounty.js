import {
    SlashCommandBuilder,
    AttachmentBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    PermissionFlagsBits
} from 'discord.js';

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go from /src/commands → /src → /app
const projectRoot = path.resolve(__dirname, '../../');

// Correct path to /app/assets/bounty.png
const bountyWeeklyImage = path.join(projectRoot, 'assets', 'bounty.png');

// Debug logs
console.log("Bounty image path:", bountyWeeklyImage);
console.log("File exists:", fs.existsSync(bountyWeeklyImage));

// Stat choices
const STAT_CHOICES = [
    { label: 'Health', value: 'Health' },
    { label: 'Stamina', value: 'Stamina' },
    { label: 'Melee', value: 'Melee' },
    { label: 'Weight', value: 'Weight' },
    { label: 'Oxygen', value: 'Oxygen' },
    { label: 'Food', value: 'Food' },
];

// Helper: random stat
function randomStat() {
    return STAT_CHOICES[Math.floor(Math.random() * STAT_CHOICES.length)].value;
}

export default {
    data: new SlashCommandBuilder()
        .setName('bounty')
        .setDescription('Start the weekly bounty posting wizard.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('Begin the weekly bounty posting wizard.')

                // REQUIRED OPTIONS FIRST
                .addStringOption(o =>
                    o.setName('dino1')
                        .setDescription('Dino 1 name')
                        .setRequired(true)
                )
                .addStringOption(o =>
                    o.setName('dino2')
                        .setDescription('Dino 2 name')
                        .setRequired(true)
                )
                .addStringOption(o =>
                    o.setName('dino3')
                        .setDescription('Dino 3 name')
                        .setRequired(true)
                )
                .addStringOption(o =>
                    o.setName('dino4')
                        .setDescription('Dino 4 name')
                        .setRequired(true)
                )
                .addRoleOption(o =>
                    o.setName('tagrole')
                        .setDescription('Role to tag in the bounty post')
                        .setRequired(true)
                )

                // OPTIONAL BONUS LAST (fixes Discord error)
                .addStringOption(o =>
                    o.setName('bonus')
                        .setDescription('Bonus bounty description')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '🛑 Only administrators may start the bounty wizard.',
                ephemeral: true
            });
        }

        const d1 = interaction.options.getString('dino1');
        const d2 = interaction.options.getString('dino2');
        const d3 = interaction.options.getString('dino3');
        const d4 = interaction.options.getString('dino4');

        const bonus = interaction.options.getString('bonus') || null;
        const tagRole = interaction.options.getRole('tagrole');

        let stats = {
            d1: 'Melee',
            d2: 'Melee',
            d3: 'Melee',
            d4: 'Melee'
        };

        const statMenus = [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('stat_d1')
                    .setPlaceholder('Select stat for Dino 1')
                    .addOptions(STAT_CHOICES)
            ),
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('stat_d2')
                    .setPlaceholder('Select stat for Dino 2')
                    .addOptions(STAT_CHOICES)
            ),
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('stat_d3')
                    .setPlaceholder('Select stat for Dino 3')
                    .addOptions(STAT_CHOICES)
            ),
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('stat_d4')
                    .setPlaceholder('Select stat for Dino 4')
                    .addOptions(STAT_CHOICES)
            )
        ];

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('randomize_stats')
                .setLabel('Randomize All Stats')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('post_bounty')
                .setLabel('Post Bounty')
                .setStyle(ButtonStyle.Success)
        );

        const panelEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🜁 Bounty Setup Panel 🜁')
            .setDescription(
                `Set stats for each dino or randomize them.\n` +
                `Range is automatically **40–50**.\n\n` +
                `**Dino 1:** ${d1}\n` +
                `**Dino 2:** ${d2}\n` +
                `**Dino 3:** ${d3}\n` +
                `**Dino 4:** ${d4}\n\n` +
                (bonus ? `⚡ Bonus Bounty: ${bonus}\n\n` : ``) +
                `Tagging: <@&${tagRole.id}>`
            );

        await interaction.reply({
            embeds: [panelEmbed],
            components: [...statMenus, buttons]
        });

        const collector = interaction.channel.createMessageComponentCollector({
            time: 600000
        });

        collector.on('collect', async i => {

            if (i.customId === 'randomize_stats') {
                stats.d1 = randomStat();
                stats.d2 = randomStat();
                stats.d3 = randomStat();
                stats.d4 = randomStat();

                await i.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#2b2d31')
                            .setTitle('🜁 Bounty Setup Panel 🜁')
                            .setDescription(
                                `Stats randomized.\nRange is **40–50**.\n\n` +
                                `**${d1}:** ${stats.d1}\n` +
                                `**${d2}:** ${stats.d2}\n` +
                                `**${d3}:** ${stats.d3}\n` +
                                `**${d4}:** ${stats.d4}\n\n` +
                                (bonus ? `⚡ Bonus Bounty: ${bonus}\n\n` : ``) +
                                `Tagging: <@&${tagRole.id}>`
                            )
                    ],
                    components: [...statMenus, buttons]
                });
            }

            if (i.customId.startsWith('stat_')) {
                const dinoKey = i.customId.split('_')[1];
                stats[dinoKey] = i.values[0];

                await i.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#2b2d31')
                            .setTitle('🜁 Bounty Setup Panel 🜁')
                            .setDescription(
                                `Stats updated.\nRange is **40–50**.\n\n` +
                                `**${d1}:** ${stats.d1}\n` +
                                `**${d2}:** ${stats.d2}\n` +
                                `**${d3}:** ${stats.d3}\n` +
                                `**${d4}:** ${stats.d4}\n\n` +
                                (bonus ? `⚡ Bonus Bounty: ${bonus}\n\n` : ``) +
                                `Tagging: <@&${tagRole.id}>`
                            )
                    ],
                    components: [...statMenus, buttons]
                });
            }

            if (i.customId === 'post_bounty') {

                const bountyImage = new AttachmentBuilder(bountyWeeklyImage);

                const embed = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setImage('attachment://bounty.png')
                    .setTitle('🜁 THE WEEKLY HUNT 🜁')
                    .setDescription(
                        `⚔️ **Targets of the Week**\n` +
                        `• ${d1} — ${stats.d1} ▸ 40–50\n` +
                        `• ${d2} — ${stats.d2} ▸ 40–50\n` +
                        `• ${d3} — ${stats.d3} ▸ 40–50\n` +
                        `• ${d4} — ${stats.d4} ▸ 40–50\n\n` +
                        (bonus ? `⚡ **Bonus Bounty:** ${bonus}\n\n` : ``) +
                        `🜁 **Summoned Order:** <@&${tagRole.id}>\n\n` +
                        `⚡ Present your offerings, Witchers.`
                    );

                await i.update({
                    embeds: [embed],
                    files: [bountyImage],
                    components: []
                });

                collector.stop();
            }
        });
    }
};
