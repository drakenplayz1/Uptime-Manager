const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags
} = require('discord.js');
const os = require('os');

module.exports = {
  name: 'team',
  aliases: ['add', 'stats', 'bi'],
  description: 'Show developer info and bot stats',

  async execute(message, args) {
    const uptime = process.uptime(); // seconds
    const memUsage = process.memoryUsage();
    const totalMemMB = os.totalmem() / 1024 / 1024;
    const freeMemMB = os.freemem() / 1024 / 1024;
    const usedMemMB = totalMemMB - freeMemMB;
    const cpuUsage = process.cpuUsage();
    
    const uptimeString = formatDuration(uptime * 1000);

    const container = new ContainerBuilder()
      .setAccentColor(0x08fff8)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            '# **Developer Info**\n',
            `- ID: \`702465506501722202\`\n`,
            `- Username: [draken_playz1](https://discord.com/users/702465506501722202)\n`,
            `- GitHub: [Click Here](https://github.com/drakenplayz1)\n`,
            `- Support Server: [Join Here](https://discord.gg/3zvKDmNcRZ)\n`,
            '-# ~~                                                                                                               ~~\n',
            '# **Bot Stats**\n',
            `- Uptime: \`${uptimeString}\`\n`,
            `- Memory Usage: ${Math.round(memUsage.rss / 1024 / 1024)} MB (RSS)\n`,
            `- CPU Usage: User ${Math.round(cpuUsage.user / 1000)} ms, System ${Math.round(cpuUsage.system / 1000)} ms\n`,
            `- System Memory Used: ${usedMemMB.toFixed(2)} MB / ${totalMemMB.toFixed(2)} MB\n`,
            '-# ~~                                                                                                               ~~\n'
          ].join('')
        )
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('GitHub')
            .setURL('https://github.com/drakenplayz1')
            .setStyle('Link'),
          new ButtonBuilder()
            .setLabel('Support Server')
            .setURL('https://discord.gg/3zvKDmNcRZ')
            .setStyle('Link')
        )
      );

    return await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}