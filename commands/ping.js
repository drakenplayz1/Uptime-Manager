const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags
} = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
  name: 'ping',
  description: 'Check bot latency, WebSocket ping, and MongoDB ping',

  async execute(message, args) {
    // Save start time for Mongo
    const mongoStart = Date.now();
    let mongoPing;
    try {
      await mongoose.connection.db.command({ ping: 1 });
      mongoPing = Date.now() - mongoStart;
    } catch (err) {
      mongoPing = 'Error';
    }

    // Message and WS latency
    const sent = await message.reply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x08fff8)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('Calculating ping...')
          )
      ],
      flags: MessageFlags.IsComponentsV2
    });

    const msgLatency = sent.createdTimestamp - message.createdTimestamp;
    const wsPing = Math.round(message.client.ws.ping);

    // Build the response container
    const latencyContainer = new ContainerBuilder()
      .setAccentColor(0x08fff8)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            `# 🏓 Ping Stats\n`,
            `-# ~~                                                                                                               ~~\n`,
            `**Message:** \`${msgLatency}ms\`\n`,
            `**WebSocket:** \`${wsPing}ms\`\n`,
            `**MongoDB:** \`${mongoPing}ms\`\n`,
            `-# ~~                                                                                                               ~~\n`
          ].join('')
        )
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ping_refresh')
            .setLabel('Refresh')
            .setStyle('Primary')
        )
      );

    await sent.edit({
      components: [latencyContainer],
      flags: MessageFlags.IsComponentsV2
    });
  }
};