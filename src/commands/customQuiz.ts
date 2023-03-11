//@ts-ignore
const { SlashCommandBuilder } = require('discord.js');
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();
const Joi = require('joi');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('customquiz')
        .setDescription('Configure Custom Quizzes')
        .addStringOption((option: any) =>
            option.setName('Action')
                .setDescription('What part would you like to practice?')
                .setRequired(true)
                .addChoices(
                    { name: 'Create New Quiz', value: 'create' },
                    { name: 'Delete Quiz', value: 'delete' },
                    { name: 'List Quizzes', value: 'list' },
                ))
        .addStringOption((option: any) =>
            option.setName('Code')
                .setDescription('Enter in the quiz code for the quiz you want to create/edit/delete. No quiz code needed if you are using the list option.')
                .setRequired(false)),

    async execute(interaction: any) {

        let action = interaction.options.getString('Action');
        let code = interaction.options.getString('Code') ? interaction.options.getString('Code') : null;
        let inputSchema = Joi.object({
            code: Joi.string()
                .alphanum()
                .min(1)
                .max(64),

            question: Joi.string()
                .min(1),

            answer: Joi.string()
                .min(1)
        });

        let dbUser = await prisma.user.findFirst({
            where: {
                id: interaction.user.id
            }
        })

        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    id: interaction.user.id
                }
            })
        }

        /////////////////// ACTION CREATE ///////////////////
        if (action === "create") {

            // Validate Input
            if (code === null) {
                return interaction.reply(`Error: You did not type in a code`);
            };

            if (!inputSchema.validate({ code: code })) {
                return interaction.reply(`Error: invalid Code. Code must be Alphnumeric, have at least one character, and have a maximum of 64 characters.`)
            };

            if (dbUser.quizzes.includes(code)) {
                return interaction.reply(`Error: You already have a quiz with this code`);
            };
            // Done validating input

            // Gather questions and answers
            interaction.reply(`Please type your first question`);
        }


        /////////////////// ACTION DELETE ///////////////////
        if (action === "delete") {

        }


        /////////////////// ACTION LIST ///////////////////
        if (action === "list") {

        }




    },
};