// utils/uptimeMonitor.js
const Watchlist = require('../models/Watchlist');
const { EmbedBuilder } = require('discord.js');

class UptimeMonitor {
    constructor(client) {
        this.client = client;
        this.checkInterval = null;
        this.CHECK_INTERVAL_MS = 15000; // 15 seconds
    }

    start() {
        console.log('🔄 Starting uptime monitoring...');
        this.checkInterval = setInterval(() => {
            this.checkAllBots();
        }, this.CHECK_INTERVAL_MS);

        // Initial check
        this.checkAllBots();
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    async checkAllBots() {
        try {
            const watchedBots = await Watchlist.find({});
            
            for (const botEntry of watchedBots) {
                await this.checkBotStatus(botEntry);
            }
        } catch (error) {
            console.error('Error checking bots:', error);
        }
    }

    async checkBotStatus(botEntry) {
        try {
            const guild = this.client.guilds.cache.get(botEntry.guildId);
            if (!guild) return;

            const member = await guild.members.fetch(botEntry.botId).catch(() => null);
            const isCurrentlyOnline = member && member.presence?.status !== 'offline';
            
            // Status changed
            if (isCurrentlyOnline !== botEntry.isOnline) {
                const now = new Date();
                const timeDiff = now - new Date(botEntry.lastStatusChange);
                
                // Update uptime/downtime
                if (botEntry.isOnline) {
                    botEntry.totalUptime += timeDiff;
                } else {
                    botEntry.totalDowntime += timeDiff;
                }
                
                // Update status
                botEntry.isOnline = isCurrentlyOnline;
                botEntry.lastStatusChange = now;
                await botEntry.save();
                
                // Send notification
                await this.sendStatusNotification(botEntry, isCurrentlyOnline, timeDiff);
            }
        } catch (error) {
            console.error(`Error checking bot ${botEntry.botId}:`, error);
        }
    }

    async sendStatusNotification(botEntry, isOnline, duration) {
  try {
    const {
      ContainerBuilder,
      TextDisplayBuilder,
      ActionRowBuilder,
      ButtonBuilder,
      MessageFlags
    } = require('discord.js');

    const channel = this.client.channels.cache.get(botEntry.channelId);
    if (!channel) return;

    const bot = await this.client.users.fetch(botEntry.botId).catch(() => null);
    const durationString = this.formatDuration(duration);

    const statusColor = isOnline ? 0x3BA55D : 0xED4245;

    let lines = [
      `# **Bot Status Update**\n`,
      `-# ~~                                                                                                               ~~\n`,
      `**Bot:** <@${botEntry.botId}> (${botEntry.botName})\n`,
      `**Status:** ${isOnline ? '🟢 Online' : '🔴 Offline'}\n`,
      `**Time:** \`${durationString}\`\n`,
      `-# ~~                                                                                                               ~~\n`
    ];
    if (bot) {
      lines.push(`[Avatar](${bot.displayAvatarURL({ dynamic: true })})`);
    }
    lines.push(`${new Date().toLocaleString()}`);
    const displayContent = lines.join('');

    const container = new ContainerBuilder()
      .setAccentColor(statusColor)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(displayContent)
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('acknowledge_status')
            .setLabel('Acknowledge')
            .setStyle(isOnline ? 'Success' : 'Danger')
        )
      );

    await channel.send({
      content: botEntry.pingRoleId ? `<@&${botEntry.pingRoleId}>` : '',
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

    formatDuration(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

module.exports = UptimeMonitor;
