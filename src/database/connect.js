const mongoose = require('mongoose');
const chalk = require('chalk');

async function connect() {
    // Skip MongoDB connection if MONGO_TOKEN is not set
    if (!process.env.MONGO_TOKEN) {
        console.log(chalk.yellow(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.yellow(`MongoDB is not configured - skipping connection`))
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
        console.log(chalk.yellow(`Continuing without MongoDB...`))
        return;
    }

    mongoose.connection.once("open", () => {
        console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MongoDB`), chalk.green(`is ready!`))
    });

    mongoose.connection.on("error", (err) => {
        console.log(chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Database`), chalk.white(`>>`), chalk.red(`Failed to connect to MongoDB!`), chalk.white(`>>`), chalk.red(`Error: ${err}`))
        console.log(chalk.yellow(`Continuing with fallback mode...`))
    });
    return;
}

module.exports = connect

