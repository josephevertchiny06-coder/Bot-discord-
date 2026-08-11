const Discord = require('discord.js');
const chalk = require('chalk');
const { random } = require('mathjs');

module.exports = async (client) => {
    console.log(`\u001b[0m`);
    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Shard #${(!client.shard ? 1 : client.shard.ids[0] + 1)}`), chalk.green(`is ready!`))
    console.log(chalk.blue(chalk.bold(`Bot`)), (chalk.white(`>>`)), chalk.green(`Started on`), chalk.red(`${client.guilds.cache.size}`), chalk.green(`servers!`))

    // Only send to webhook if it's configured
    const webhookData = client.webhooks && client.webhooks.startLogs;
    if (webhookData && webhookData.id && webhookData.token) {
        const startLogs = new Discord.WebhookClient({
            id: webhookData.id,
            token: webhookData.token,
        });

        let embed = new Discord.EmbedBuilder()
            .setTitle(`🆙・Finishing shard`)
            .setDescription(`A shard just finished`)
            .addFields(
                { name: "🆔┆ID", value: `${(!client.shard ? 1 : client.shard.ids[0] + 1)}/${(!client.options.shardCount ? 1 : client.options.shardCount)}`, inline: true },
                { name: "📃┆State", value: `Ready`, inline: true },
            )
            .setColor(client.config.colors.normal)
        startLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        }).catch(err => console.warn('Failed to send startLogs webhook:', err.message));
    }

    setInterval(async function () {
        const promises = [
            client.shard.fetchClientValues('guilds.cache.size'),
        ];
        return Promise.all(promises)
            .then(results => {
                const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
                let statuttext;
                if (process.env.DISCORD_STATUS) {
                    statuttext = process.env.DISCORD_STATUS.split(', ');
                } else {
                    statuttext = [
                        `・❓┆/help`,
                        `・💻┆${totalGuilds} servers`,
                        `・📨┆discord.gg/corwindev`,
                        `・🎉┆400+ commands`,
                        `・🏷️┆Version ${require(`${process.cwd()}/package.json`).version}`
                    ];
                }
                const randomText = statuttext[Math.floor(Math.random() * statuttext.length)];
                client.user.setPresence({ activities: [{ name: randomText, type: Discord.ActivityType.Playing }], status: 'online' });
            })
    }, 50000)

    if (client.player) {
client.player.init(client.user.id);
}

