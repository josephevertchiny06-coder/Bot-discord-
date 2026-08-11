const Discord = require('discord.js');

module.exports = async (client, d) => {
    if (client.player) {
        client.player.updateVoiceState(d);
    }
}

 