const Discord = require('discord.js');
const fs = require('fs');

// Discord client
const client = new Discord.Client({
    allowedMentions: {
        parse: [
            'users',
            'roles'
        ],
        repliedUser: true
    },
    autoReconnect: true,
    disabledEvents: [
        "TYPING_START"
    ],
    partials: [
        Discord.Partials.Channel,
        Discord.Partials.GuildMember,
        Discord.Partials.Message,
        Discord.Partials.Reaction,
        Discord.Partials.User,
        Discord.Partials.GuildScheduledEvent
    ],
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildBans,
        Discord.GatewayIntentBits.GuildEmojisAndStickers,
        Discord.GatewayIntentBits.GuildIntegrations,
        Discord.GatewayIntentBits.GuildWebhooks,
        Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.GuildMessageTyping,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.DirectMessageReactions,
        Discord.GatewayIntentBits.DirectMessageTyping,
        Discord.GatewayIntentBits.GuildScheduledEvents,
        Discord.GatewayIntentBits.MessageContent
    ],
    restTimeOffset: 0
});

// Suppress verbose discord.js logging (debug/info spam) while keeping warnings visible
client.on('debug', () => {}); // Disable debug logs
client.on('warn', (msg) => console.warn('[discord.js WARN]', msg)); // Keep warnings only

// Initialize music player ONLY if Lavalink is configured
const hasMusicConfig = process.env.LAVALINK_HOST && process.env.LAVALINK_PASSWORD;

if (hasMusicConfig) {
    try {
        const { Manager } = require("erela.js");
        const Spotify = require("erela.js-spotify");
        const Facebook = require("erela.js-facebook");
        const Deezer = require("erela.js-deezer");
        const AppleMusic = require("erela.js-apple");

        const clientID = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        
        const plugins = [
            new AppleMusic(),
            new Deezer(),
            new Facebook(),
        ];

        if (clientID && clientSecret) {
            plugins.push(new Spotify({
                clientID,
                clientSecret,
            }));
        }

        // Lavalink client
        client.player = new Manager({
            plugins,
            nodes: [
                {
                    host: process.env.LAVALINK_HOST,
                    port: parseInt(process.env.LAVALINK_PORT) || 80,
                    password: process.env.LAVALINK_PASSWORD,
                    secure: Boolean(process.env.LAVALINK_SECURE) || false
                },
            ],
            send(id, payload) {
                const guild = client.guilds.cache.get(id);
                if (guild) guild.shard.send(payload);
            },
        });

        // Load music events
        const musicEventsPath = './src/events/music';
        if (fs.existsSync(musicEventsPath)) {
            const events = fs.readdirSync(musicEventsPath).filter(files => files.endsWith('.js'));
            for (const file of events) {
                const event = require(`./events/music/${file}`);
                client.player.on(file.split(".")[0], event.bind(null, client)).setMaxListeners(0);
            }
        }

        console.log('🎵 Music player initialized');
    } catch (error) {
        console.warn('⚠️ Failed to initialize music player:', error.message);
        console.log('Bot will continue without music features');
        client.player = null;
    }
} else {
    console.log('⚠️ Music player disabled (LAVALINK_HOST not configured)');
    client.player = null;
}

// Connect to database
require("./database/connect")();

// Client settings
client.config = require('./config/bot');
client.changelogs = require('./config/changelogs');
client.emotes = require("./config/emojis.json");
client.webhooks = require("./config/webhooks.json");
const webHooksArray = ['startLogs', 'shardLogs', 'errorLogs', 'dmLogs', 'voiceLogs', 'serverLogs', 'serverLogs2', 'commandLogs', 'consoleLogs', 'warnLogs', 'voiceErrorLogs', 'creditLogs', 'evalLogs', 'interactionLogs'];
// Check if .env webhook_id and webhook_token are set
if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    for (const webhookName of webHooksArray) {
        client.webhooks[webhookName].id = process.env.WEBHOOK_ID;
        client.webhooks[webhookName].token = process.env.WEBHOOK_TOKEN;
    }
}

client.commands = new Discord.Collection();
client.playerManager = new Map();
client.triviaManager = new Map();
client.queue = new Map();

// Webhooks - safely create webhook clients
function createWebhookClient(webhookData) {
    if (!webhookData || !webhookData.id || !webhookData.token) return null;
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

const consoleLogs = createWebhookClient(client.webhooks.consoleLogs);
const warnLogs = createWebhookClient(client.webhooks.warnLogs);

// Load handlers
fs.readdirSync('./src/handlers').forEach((dir) => {
    fs.readdirSync(`./src/handlers/${dir}`).forEach((handler) => {
        require(`./handlers/${dir}/${handler}`)(client);
    });
});

client.login(process.env.DISCORD_TOKEN);

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    if (error) if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
    if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
    if(!error.stack) return
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
        .setColor(client.config.colors.normal)
    if (consoleLogs) {
        consoleLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        }).catch(() => {
            console.log('Error sending unhandledRejection to webhook')
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
        .setColor(client.config.colors.normal)
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

client.on(Discord.ShardEvents.Error, error => {
    console.log(error)
    if (error) if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
    if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
    if (!error.stack) return
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・A websocket connection encountered an error`)
        .addFields([
            {
                name: `Error`,
                value: `\`\`\`${error}\`\`\``,
            },
            {
                name: `Stack error`,
                value: `\`\`\`${error.stack}\`\`\``,
            }
        ])
        .setColor(client.config.colors.normal)
    if (consoleLogs) {
        consoleLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        });
    }
});
