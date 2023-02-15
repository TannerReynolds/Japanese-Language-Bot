const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const c = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Displays bot stats'),
    async execute(interaction: any) {
        // inside a command, event listener, etc.
        let statsEmbed = new EmbedBuilder()
            .setColor(0x5765F2)
            .setTitle('Bot Statistics')
            .setURL('https://discord.gg/SP9nYs4YPU')
            .setAuthor({ name: 'By Tanner#9999', iconURL: 'https://images-ext-2.discordapp.net/external/ouP9cdiRtEldt6AM5NxUjPcUNqqHzixx-GDAb1zjsgQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/478044823882825748/bb1c1d1ea4128b09c1a8b8d33ac19c9f.png', url: 'https://discord.gg/SP9nYs4YPU' })
            .setDescription('Some description here')
            .addFields(
                { name: 'Guild Count', value: 'Some value here' },
                { name: 'Enrolled Students', value: '\u200B' },
                { name: 'CPU Usage', value: 'Some value here' },
                { name: 'RAM Usage', value: 'asdasdas' },
                { name: 'Inline field title', value: 'Some value here' },
            )
            .setTimestamp()

        interaction.reply({ embeds: [statsEmbed] });
    }
}