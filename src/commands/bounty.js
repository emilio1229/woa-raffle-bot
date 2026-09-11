import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get absolute path to THIS file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Move UP from /src/commands/ to project root (/app)
const projectRoot = path.resolve(__dirname, '../../');

// FINAL: absolute path to /app/assets/bounty.png
const bountyWeeklyImage = path.join(projectRoot, 'assets', 'bounty.png');

export default {
    data: new SlashCommandBuilder()
        .setName('bounty')
        .setDescription('Start the weekly bounty posting wizard.')
        .addSubcommand(sub =>
            sub.setName('start')
               .setDescription('Begin the weekly bounty posting wizard.')
               .addStringOption(o => o.setName('dino1').setDescription('Dino 1 name').setRequired(true))
               .addStringOption(o => o.setName('stat1').setDescription('Dino 1 stat').setRequired(true))
               .addStringOption(o => o.setName('range1').setDescription('Dino 1 range').setRequired(true))

               .addStringOption(o => o.setName('dino2').setDescription('Dino 2 name').setRequired(true))
               .addStringOption(o => o.setName('stat2').setDescription('Dino 2 stat').setRequired(true))
               .addStringOption(o => o.setName('range2').setDescription('Dino 2 range').setRequired(true))

               .addStringOption(o => o.setName('dino3').setDescription('Dino 3 name').setRequired(true))
               .addStringOption(o => o.setName('stat3').setDescription('Dino 3 stat').setRequired(true))
               .addStringOption(o => o.setName('range3').setDescription('Dino 3 range').setRequired(true))

               .addStringOption(o => o.setName('dino4').setDescription('Dino 4 name').setRequired(true))
               .addStringOption(o => o.setName('stat4').setDescription('Dino 4 stat').setRequired(true))
               .addStringOption(o => o.setName('range4').setDescription('Dino 4 range').setRequired(true))

               .addStringOption(o => o.setName('bonus').setDescription('Bonus Offering description').setRequired(true))
        ),

    async execute(interaction) {

        const d1 = interaction.options.getString('dino1');
        const s1 = interaction.options.getString('stat1');
        const r1 = interaction.options.getString('range1');

        const d2 = interaction.options.getString('dino2');
        const s2 = interaction.options.getString('stat2');
        const r2 = interaction.options.getString('range2');

        const d3 = interaction.options.getString('dino3');
        const s3 = interaction.options.getString('stat3');
        const r3 = interaction.options.getString('range3');

        const d4 = interaction.options.getString('dino4');
        const s4 = interaction.options.getString('stat4');
        const r4 = interaction.options.getString('range4');

        const bonus = interaction.options.getString('bonus');

        const bountyImage = new AttachmentBuilder(bountyWeeklyImage);

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setImage('attachment://bounty.png')
            .setTitle('🜁 THE WEEKLY HUNT 🜁')
            .setDescription(
                `⚔️ **Targets of the Week**\n` +
                `• ${d1} — ${s1} ▸ ${r1}\n` +
                `• ${d2} — ${s2} ▸ ${r2}\n` +
                `• ${d3} — ${s3} ▸ ${r3}\n` +
                `• ${d4} — ${s4} ▸ ${r4}\n\n` +
                `🜂 **Bonus Offering**\n` +
                `${bonus}\n\n` +
                `⚡ Present your offerings, Witchers.`
            );

        await interaction.reply({
            embeds: [embed],
            files: [bountyImage]
        });
    }
};
