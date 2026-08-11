module.exports = async (e) => {
    // Only log actual errors, not noise from discord.js internal events
    if (e && e.message && e.message.includes('401')) {
        console.error('Discord API Error:', e.message);
    }
    // Suppress verbose noise from discord.js
};