const mongoose = require('mongoose');
const chalk = require('chalk');

async function connect() {
    // Check if MongoDB is configured
    if (!process.env.MONGO_TOKEN) {
        console.log(chalk.yellow('⚠️ MongoDB is disabled (MONGO_TOKEN not configured)'));
        console.log(chalk.yellow('Database features will be unavailable'));
        return;
    }

    mongoose.set('strictQuery', false);
    try {
        console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MongoDB`), chalk.green(`is connecting...`))
        await mongoose.connect(process.env.MONGO_TOKEN, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (err) {
        console.log(chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MongoDB`), chalk.white(`>>`), chalk.red(`Failed to connect to MongoDB!`), chalk.white(`>>`), chalk.red(`Error: ${err}`))
        console.log(chalk.yellow('⚠️ Bot will continue without database features'));
        return; // Continue without crashing
    }

    mongoose.connection.once("open", () => {
        console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MongoDB`), chalk.green(`is ready!`))
    });

    mongoose.connection.on("error", (err) => {
        console.log(chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Database`), chalk.white(`>>`), chalk.red(`Failed to connect to MongoDB!`), chalk.white(`>>`), chalk.red(`Error: ${err}`))
        console.log(chalk.yellow('⚠️ Database connection lost, but bot continues'));
        // Don't exit on error - let bot continue
    });
    return;
}

module.exports = connect
