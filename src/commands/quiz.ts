import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();

const { SlashCommandBuilder } = require('discord.js');
const characterMap = require('../data/botData.json');
const hiraganaSet = characterMap['hiragana'];
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('Initiates a quiz')
        .addStringOption((option: any) =>
            option.setName('category')
                .setDescription('What part would you like to practice?')
                .setRequired(true)
                .addChoices(
                    { name: 'Hiragana', value: 'hiragana' },
                    { name: 'Hiragana Words and Phrases', value: 'hiraganawords' },
                    { name: 'Translate To Hiragana Words and Phrases', value: 'enghiragana' },
                    //{ name: 'Katakana', value: 'katakana' },
                    //{ name: 'Kanji', value: 'kanji' },
                ))
        .addNumberOption((option: any) =>
            option.setName('difficulty')
                .setDescription('Choose the difficulty of the quiz')
                .setRequired(true)
                .addChoices(
                    { name: 'Easy', value: 0 },
                    { name: 'Medium', value: 1 },
                    { name: 'Advanced', value: 2 },
                    { name: 'Master', value: 3 },
                )),


    async execute(interaction: any) {
        let category = interaction.options.getString('category');
        let difficulty = interaction.options.getNumber('difficulty');
        let characterSet = characterMap[category]

        let dbUserCheck = await prisma.user.findFirst({
            where: {
                id: interaction.user.id
            }
        })

        if (!dbUserCheck) {
            dbUserCheck = await prisma.user.create({
                data: {
                    id: interaction.user.id
                }
            })
        }

        if (category === "hiragana") {
            await characterQuiz();
        }

        if (category === "hiraganawords") {
            await wordQuiz('hiragana', 'hiraganawords');
        }

        if (category === "enghiragana") {
            await wordQuiz('enghiragana', 'hiraganawords');
        }


        async function characterQuiz() {
            async function fillSet(characterSet: Array<any>) {
                let newSet = [];
                for (let i = 0; i < characterSet.length; i++) {
                    if (characterSet[i][4] <= difficulty) {
                        //@ts-ignore
                        await newSet.push(characterSet[i]);
                    }
                }
                return newSet;
            }

            let filteredSet = await fillSet(characterSet);

            async function selectQuestion(set: Array<any>) {
                return set[Math.floor(Math.random() * set.length)];
            }

            let scores: { [username: string]: number } = {};
            scores[interaction.user.username] = 0;

            await interaction.reply(`Starting ${category} quiz!`);

            startQuiz();

            async function startQuiz() {
                let question = await selectQuestion(filteredSet);
                let romaji = question[0];
                let emoji = question[1];
                let hiragana = question[2];
                let filter = (response: any) => {
                    return romaji.toLowerCase() === response.content.toLowerCase() || hiragana === response.content.toLowerCase();
                }
                await wait(3000);
                interaction.followUp({ content: `Which hiragana character is this: ${emoji}`, fetchReply: true }).then(() => {
                    interaction.channel.awaitMessages({ filter, max: 1, time: 8000, errors: ['time'] })
                        .then((collected: any) => {
                            interaction.followUp(`${collected.first().author.username}, you were the first to get it right!`);
                            if (!scores[collected.first().author.username]) {
                                scores[collected.first().author.username] = 1;
                            } else {
                                scores[collected.first().author.username] = scores[collected.first().author.username] + 1;
                            }
                            return startQuiz();
                        })
                        .catch((err: any) => {
                            let finalScores = [];
                            for (let player in scores) {
                                finalScores.push(`${player}: ${scores[player]}`);
                            }
                            return interaction.followUp(`Nobody got the answer right! The correct answer was "${romaji}"\nFinal Scores:\n${finalScores.join('\n')}`);
                        })
                }).catch((e: any) => console.log(e))
            }
        }



        async function wordQuiz(mode: string, set: string) {
            //["Gozen", "ごぜん", "A.M.", 0],
            let characterSet = characterMap[set]
            async function fillSet(characterSet: Array<any>) {
                let newSet = [];
                for (let i = 0; i < characterSet.length; i++) {
                    if (characterSet[i][3] <= difficulty) {
                        //@ts-ignore
                        await newSet.push(characterSet[i]);
                    }
                }
                return newSet;
            }

            let filteredSet = await fillSet(characterSet);

            async function selectQuestion(set: Array<any>) {
                return set[Math.floor(Math.random() * set.length)];
            }

            let scores: { [id: string]: number } = {};
            scores[interaction.user.id] = 0;

            await interaction.reply(`Starting ${category} quiz!`);

            startQuiz();

            async function startQuiz() {
                let question = await selectQuestion(filteredSet);
                let romaji = question[0];
                let hiragana = question[1];
                let translation = question[2];
                let askedQuestion: any;
                if (mode === "hiragana") {
                    askedQuestion = await emojify(hiragana);
                }
                if (mode === "enghiragana") {
                    askedQuestion = translation;
                }
                let filter: any;
                if (mode === "hiragana") {
                    filter = (response: any) => {
                        return romaji.toLowerCase() === response.content.toLowerCase() || hiragana === response.content.toLowerCase() || translation.toLowerCase() === response.content.toLowerCase();
                    }
                }
                if (mode === "enghiragana") {
                    filter = (response: any) => {
                        return romaji.toLowerCase() === response.content.toLowerCase() || hiragana === response.content.toLowerCase();
                    }
                }
                await wait(3000);
                interaction.followUp({ content: `What does this say?: ${askedQuestion}`, fetchReply: true }).then(() => {
                    performQuiz();
                    async function performQuiz() {
                        interaction.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] })
                            .then((collected: any) => {
                                interaction.followUp(`${collected.first().author.username}, you were the first to get it right! The correct answer was "${romaji}"! Meaning "${translation}"!`);
                                if (!scores[collected.first().author.id]) {
                                    scores[collected.first().author.id] = 1;
                                } else {
                                    scores[collected.first().author.id] = scores[collected.first().author.id] + 1;
                                }
                                return startQuiz();
                            })
                            .catch(async (err: any) => {
                                let finalScores: any = [];
                                for (let player in scores) {
                                    let psc = await getFinalResults(player)
                                    async function getFinalResults(dbPlayer: any) {
                                        await getPlayer();
                                        let playerObj = await prisma.user.findFirst({
                                            where: {
                                                id: player
                                            }
                                        })
                                        await prisma.user.update({
                                            where: { id: player },
                                            data: {
                                                //@ts-ignore
                                                score: playerObj.score + scores[player]
                                            }
                                        })
                                        let playerName = await interaction.client.users.fetch(player).username;
                                        //@ts-ignore
                                        return await `${playerName}: ${scores[player]} | Total Score: ${playerObj.score + scores[player]}`;
                                    };
                                    await finalScores.push(psc);
                                    async function getPlayer() {
                                        let doesPlayerExist = await prisma.user.findFirst({
                                            where: {
                                                id: player
                                            }
                                        })
                                        if (!doesPlayerExist) {
                                            doesPlayerExist = await prisma.user.create({
                                                data: {
                                                    id: player
                                                }
                                            })
                                        }
                                        return doesPlayerExist
                                    }
                                }

                                return await interaction.followUp(`Nobody got the answer right! The correct answer was "${romaji}"! Meaning "${translation}"\nFinal Scores:\n${finalScores.join('\n')}`);
                            })
                    }
                }).catch((e: any) => console.log(e))
            }
        }

    },
};

async function emojify(hiragana: string) {
    let result: Array<String> = hiragana.split('').map(char => {
        let item: any = hiraganaSet.find((item: any) => item[2] === char);
        if (item) {
            return item[1];
        }
        return char;
    });
    let resultString: string = result.join('');
    return resultString;
}