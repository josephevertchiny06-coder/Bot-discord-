const Discord = require('discord.js');
const chalk = require('chalk');
const axios = require('axios');
// Check if is up to date
const { version } = require('.././package.json');
axios.get('https://api.github.com/repos/CorwinDev/Discord-Bot/releases/latest').then(res => {
    if (res.data.tag_name !== version) {
        console.log(chalk.red.bgYellow(`Your bot is not up to date! Please update to the latest version!`, version + ' -> ' + res.data.tag_name));
    }
}).catch(err => {
    console.log(chalk.red.bgYellow(`Failed to check if bot is up to date!`));
});


const webhook = require("./config/webhooks.json");
const config = require("./config/bot.js");
const webHooksArray = ['startLogs', 'shardLogs', 'errorLogs', 'dmLogs', 'voiceLogs', 'serverLogs', 'serverLogs2', 'commandLogs', 'consoleLogs', 'warnLogs', 'voiceErrorLogs', 'creditLogs', 'evalLogs', 'interactionLogs'];
// Check if .env webhook_id and webhook_token are set
if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    for (const webhookName of webHooksArray) {
        webhook[webhookName].id = process.env.WEBHOOK_ID;
        webhook[webhookName].token = process.env.WEBHOOK_TOKEN;
    }
}

// Helper function to safely create webhook clients
function createWebhookClient(webhookData) {
    if (!webhookData || !webhookData.id || !webhookData.token) {
        return null; // Return null if webhook is not configured
    }
    try {
        return new Discord.WebhookClient({
            id: webhookData.id,
            token: webhookData.token,
        });
    } catch (err) {
        console.warn(`Failed to create webhook client:`, err.message);
        return null;
    }
}

const startLogs = createWebhookClient(webhook.startLogs);
const shardLogs = createWebhookClient(webhook.shardLogs);

const manager = new Discord.ShardingManager('./src/bot.js', {
    totalShards: 'auto',
    token: process.env.DISCORD_TOKEN,
    respawn: true
});
if (process.env.TOPGG_TOKEN) {
    const { AutoPoster } = require('topgg-autoposter');
    AutoPoster(process.env.TOPGG_TOKEN, manager);
}
console.clear();
console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Starting up`)), (chalk.white(`...`)))
console.log(`\u001b[0m`)
console.log(chalk.red(`© CorwinDev | 2021 - ${new Date().getFullYear()}`))
console.log(chalk.red(`All rights reserved`))
console.log(`\u001b[0m`)
console.log(`\u001b[0m`)
console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Version ${require(`${process.cwd()}/package.json`).version}`), (chalk.green(`loaded`)))
console.log(`\u001b[0m`);

manager.on('shardCreate', shard => {
    let embed = new Discord.EmbedBuilder()
        .setTitle(`🆙・Launching shard`)
        .setDescription(`A shard has just been launched`)
        .setFields([
            {
                name: "🆔┆ID",
                value: `${shard.id + 1}/${manager.totalShards}`,
                inline: true
            },
            {
                name: `📃┆State`,
                value: `Starting up...`,
                inline: true
            }
        ])
        .setColor(config.colors.normal)
    if (startLogs) {
        startLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        }).catch(err => console.warn('Failed to send startLogs webhook:', err.message));
    }

    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Starting`)), chalk.red(`Shard #${shard.id + 1}`), (chalk.white(`...`)))
    console.log(`\u001b[0m`);

    shard.on("death", (process) => {
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🚨・Closing shard ${shard.id + 1}/${manager.totalShards} unexpectedly`)
            .setFields([
                {
                    name: "🆔┆ID",
                    value: `${shard.id + 1}/${manager.totalShards}`,
                },
            ])
            .setColor(config.colors.normal)
        if (shardLogs) {
            shardLogs.send({
                username: 'Bot Logs',
                embeds: [embed]
            }).catch(err => console.warn('Failed to send shardLogs webhook:', err.message));
        }

        if (process.exitCode === null) {
            const embed = new Discord.EmbedBuilder()
                .setTitle(`🚨・Shard ${shard.id + 1}/${manager.totalShards} exited with NULL error code!`)
                .setFields([
                    {
                        name: "PID",
                        value: `\`${process.pid}\``,
                    },
                    {
                        name: "Exit code",
                        value: `\`${process.exitCode}\``,
                    }
                ])
                .setColor(config.colors.normal)
            if (shardLogs) {
                shardLogs.send({
                    username: 'Bot Logs',
                    embeds: [embed]
                }).catch(err => console.warn('Failed to send shardLogs webhook:', err.message));
            }
        }
    });

    shard.on("shardDisconnect", (event) => {
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🚨・Shard ${shard.id + 1}/${manager.totalShards} disconnected`)
            .setDescription("Dumping socket close event...")
            .setColor(config.colors.normal)
        if (shardLogs) {
            shardLogs.send({
                username: 'Bot Logs',
                embeds: [embed],
            }).catch(err => console.warn('Failed to send shardLogs webhook:', err.message));
        }
    });

    shard.on("shardReconnecting", () => {
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🚨・Reconnecting shard ${shard.id + 1}/${manager.totalShards}`)
            .setColor(config.colors.normal)
        if (shardLogs) {
            shardLogs.send({
                username: 'Bot Logs',
                embeds: [embed],
            }).catch(err => console.warn('Failed to send shardLogs webhook:', err.message));
        }
    });
});


manager.spawn();


// Webhooks
const consoleLogs = createWebhookClient(webhook.consoleLogs);
const warnLogs = createWebhookClient(webhook.warnLogs);

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    if (error) if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
    if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
    if (!error.stack) return
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・Unhandled promise rejection`)
        .addFields([
            {
                name: "Error",
                value: error ? Discord.codeBlock(error) : "No error",
            },
            {
                name: "Stack error",
                value: error.stack ? Discord.codeBlock(error.stack) : "No stack error",
            }
        ])
    if (consoleLogs) {
        consoleLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        }).catch(() => {
            console.log('Error sending unhandled promise rejection to webhook')
            console.log(error)
        })
    }
});

process.on('warning', warn => {
    console.warn("Warning:", warn);
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・New warning found`)
        .addFields([
            {
                name: `Warn`,
                value: `\`\`\`${warn}\`\`\``,
            },
        ])
    if (warnLogs) {
        warnLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        }).catch(() => {
            console.log('Error sending warning to webhook')
            console.log(warn)
        })
    }
});

