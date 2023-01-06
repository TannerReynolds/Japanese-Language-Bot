const { SlashCommandBuilder } = require('discord.js');
const characterMap = require('../data/characterMap.json');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('quiz')
        .setDescription('Initiates a quiz')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('What part would you like to practice?')
                .setRequired(true)
                .addChoices(
                    { name: 'Hiragana', value: 'hiragana' },
                    //{ name: 'Katakana', value: 'katakana' },
                    //{ name: 'Kanji', value: 'kanji' },
                ))
        .addNumberOption(option =>
            option.setName('difficulty')
                .setDescription('Choose the difficulty of the quiz')
                .setRequired(true)
                .addChoices(
                    { name: 'Easy', value: 0 },
                    { name: 'Medium', value: 1 },
                    { name: 'Advanced', value: 2 },
                    { name: 'Master', value: 3 },
                )),


	async execute(interaction) {
        let category = interaction.options.getString('category');
        let difficulty = interaction.options.getNumber('difficulty');
        let characterSet = characterMap[category]

        // ["_", "<:_:00000>", "_", _, _],
        // 0 = Romaji, 1 = Emoji Code, 2 = Hiragana Character, 3 = File Number, 4 = Difficulty Setting

        async function fillSet(characterSet) {
            let newSet = [];
            for(let i = 0; i < characterSet.length; i++) {
                if(characterSet[i][4] <= difficulty) {
                    //@ts-ignore
                    await newSet.push(characterSet[i]);
                }
            }
            return newSet;
        }

        let filteredSet = await fillSet(characterSet);

        async function selectQuestion(set) {
            return set[Math.floor(Math.random() * set.length)];
        }

        let scores = new Object();
        scores[interaction.user.username] = 0;

        await interaction.reply(`Starting ${category} quiz!`);

        startQuiz();
        
        async function startQuiz() {
            let question = await selectQuestion(filteredSet);
            let romaji = question[0];
            let emoji = question[1];
            let hiragana = question[2];
            let filter = response => {
                console.log(response.content);
                console.log(romaji.toLowerCase() === response.content.toLowerCase() || hiragana === response.content.toLowerCase())
                return romaji.toLowerCase() === response.content.toLowerCase() || hiragana === response.content.toLowerCase();
            }
            await wait(3000);
            interaction.followUp({ content: `Which hiragana character is this: ${emoji}`, fetchReply: true }).then(() => {
                interaction.channel.awaitMessages({ filter, max: 1, time: 8000, errors: ['time'] })
                .then(collected => {
                    interaction.followUp(`${collected.first().author.username}, you were the first to get it right!`);
                    if(!scores[collected.first().author.username]) {
                        scores[collected.first().author.username] = 1;
                    } else {
                        scores[collected.first().author.username] = scores[collected.first().author.username] + 1;
                    }
                    return startQuiz();
                })
                .catch(err => {
                    console.log(err)
                    let finalScores = [];
                    for(let player in scores) {
                        finalScores.push(`${player}: ${scores[player]}`);
                    }
                    return interaction.followUp(`Nobody got the answer right! The correct answer was "${romaji}"\nFinal Scores:\n${finalScores.join('\n')}`);
                })
            }).catch(e => console.log(e))
        }
	},
};