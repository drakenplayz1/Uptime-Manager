// events/interactionCreate.js
const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags
} = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    if (!interaction.isMessageComponent()) return;
    if (interaction.customId !== 'ping_refresh') return;

    async function getPingStats(msg, client) {
      const mongoStart = Date.now();
      let mongoPing;
      try {
        await mongoose.connection.db.command({ ping: 1 });
        mongoPing = Date.now() - mongoStart;
      } catch (err) {
        mongoPing = 'Error';
      }
      const wsPing = Math.round(client.ws.ping);
      const now = Date.now();
      const msgLatency = now - msg.createdTimestamp;
      return { msgLatency, wsPing, mongoPing };
    }

    function getContainer(stats) {
      return new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              `# 🏓 Ping Stats\n`,
              `-# ~~                                                                                                               ~~\n`,
              `**Message:** \`${stats.msgLatency}ms\`\n`,
              `**WebSocket:** \`${stats.wsPing}ms\`\n`,
              `**MongoDB:** \`${stats.mongoPing}ms\`\n`,
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
    }

    const stats = await getPingStats(interaction.message, interaction.client);
    const container = getContainer(stats);

    await interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};