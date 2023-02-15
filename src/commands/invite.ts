//@ts-ignore
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invite')
		.setDescription('Gives you a link to invite the bot'),
	async execute(interaction: any) {
		await interaction.reply('https://discord.com/api/oauth2/authorize?client_id=1060361909636956220&permissions=8&scope=bot%20applications.commands');
	},
};