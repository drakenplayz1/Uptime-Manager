// index.js
const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

client.commands = new Collection();
client.prefix = process.env.PREFIX || '!';

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.name, command);
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Start uptime monitoring
const UptimeMonitor = require('./utils/uptimeMonitor');
const monitor = new UptimeMonitor(client);

client.once('ready', () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    
    // Set bot status
    client.user.setPresence({
        activities: [{ name: 'Draik Development </>', type: ActivityType.Watching }],
        status: 'online',
    });
    
    // Start monitoring
    monitor.start();
});

// Interaction Handler - Not Needed You Can Remove This Part
/*client.on('interactionCreate', async (interaction) => {
  if (!interaction.isMessageComponent()) return;
  if (interaction.customId !== 'ping_refresh') return;

  // The getPingStats and getContainer functions should be available or moved/imported here
  const stats = await getPingStats(interaction.message, interaction.client);

  await interaction.update({
    components: [getContainer(stats)],
    flags: MessageFlags.IsComponentsV2
  });
}); */

// Command Handler
client.on('messageCreate', message => {
    if (!message.content.startsWith(client.prefix) || message.author.bot) return;

    const args = message.content.slice(client.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        command.execute(message, args);
    } catch (error) {
        console.error('Error executing command:', error);
        message.reply('There was an error executing this command!');
    }
});

client.login(process.env.DISCORD_TOKEN);