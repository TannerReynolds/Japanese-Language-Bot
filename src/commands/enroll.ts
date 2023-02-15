//@ts-ignore
const { SlashCommandBuilder } = require('discord.js');
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const c = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enroll')
        .setDescription('Enrolls you into the bot\'s Japanese Course '),
    async execute(interaction: any) {

        /*
        // Standard Definitions
        */
        let user = interaction.user.id;
        let botGuild = interaction.client.guilds.fetch(c.guildID);
        let premiumRoles = ["1061932931670609942", "1061931345317724221"];
        let memberRoles = botGuild.members.fetch(user).roles;
        let userEntry = await prisma.user.findFirst({
            where: {
                id: user
            }
        })

        /*
        // Create user if none exists
        */
        if (!userEntry) {
            await prisma.user.create({
                data: {
                    id: user
                }
            })
        }


        /*
        // Ignore all guild and premium checks if this is in the Top.gg Verification guilds
        */
        if (interaction.guild.id === "333949691962195969" || interaction.guild.id === "264445053596991498") {
            await prisma.user.update({
                where: { id: user },
                data: {
                    //@ts-ignore
                    premium: true,
                    enrolledDate: new Date()
                }
            })
            return await interaction.reply('You are now enrolled in our course!');
        }
        /*
        // Check to see if the user is a guild member
        */
        if (!botGuild.members.fetch(user)) {
            return await interaction.reply('You must be a member of our server in order to enroll!\nhttps://discord.gg/SP9nYs4YPU');
        }

        /*
        // Check to see if the user has premium in our database
        */
        if (!userEntry || !userEntry.premium) {
            /*
           // Check to see if the user has premium roles
           */
            if (!memberRoles.includes(premiumRoles[0]) || !memberRoles.includes(premiumRoles[1])) {
                return await interaction.reply('You must have an active subscription to our server in order to access our all-access japanese course!\nhttps://canary.discord.com/channels/1061175459112550490/role-subscriptions');
            }
        }

        /*
        // Check to see if the user has premium roles again then grant them enrollment
        */
        if (!memberRoles.includes(premiumRoles[0]) || !memberRoles.includes(premiumRoles[1])) {
            await prisma.user.update({
                where: { id: user },
                data: {
                    //@ts-ignore
                    premium: true,
                    enrolledDate: new Date()
                }
            })
            return await interaction.reply('You are now enrolled in our course!');
        }
    },
};