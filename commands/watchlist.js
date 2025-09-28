const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  MessageFlags
} = require('discord.js');
const Watchlist = require('../models/Watchlist');

module.exports = {
  name: 'watchlist',
  description: 'Manage bot watchlist using Components V2 containers',

  async execute(message, args) {
    if (!message.member.permissions.has('Administrator')) {
      const errCont = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ You need Administrator permissions to use this command.')
        );
      return message.reply({
        components: [errCont],
        flags: MessageFlags.IsComponentsV2,
      });
    }
    const subcommand = args[0]?.toLowerCase();
    switch (subcommand) {
      case 'add': return this.addBot(message, args.slice(1));
      case 'remove': return this.removeBot(message, args.slice(1));
      case 'list': return this.listBots(message);
      case 'setchannel': return this.setChannel(message, args.slice(1));
      case 'setrole': return this.setRole(message, args.slice(1));
      default: return this.showHelp(message);
    }
  },

  async addBot(message, args) {
    if (args.length < 1) {
      const usage = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ Usage:\`!watchlist add [bot_id] [channel_id] [role_id]\`')
        );
      return message.reply({ components: [usage], flags: MessageFlags.IsComponentsV2 });
    }
    const botId = args[0];
    const channelId = args[1] || message.channel.id;
    const roleId = args[2] || null;

    try {
      const bot = await message.client.users.fetch(botId).catch(() => null);
      if (!bot || !bot.bot) {
        const invalidBot = new ContainerBuilder()
          .setAccentColor(0x08fff8)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('❌ Invalid bot ID or user is not a bot.')
          );
        return message.reply({ components: [invalidBot], flags: MessageFlags.IsComponentsV2 });
      }

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) {
        const invalidCh = new ContainerBuilder()
          .setAccentColor(0x08fff8)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('❌ Invalid channel ID or channel is not text-based.')
          );
        return message.reply({ components: [invalidCh], flags: MessageFlags.IsComponentsV2 });
      }

      if (roleId) {
        const role = message.guild.roles.cache.get(roleId);
        if (!role) {
          const invalidRole = new ContainerBuilder()
            .setAccentColor(0x08fff8)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('❌ Invalid role ID.')
            );
          return message.reply({ components: [invalidRole], flags: MessageFlags.IsComponentsV2 });
        }
      }

      const existing = await Watchlist.findOne({ botId });
      if (existing) {
        const already = new ContainerBuilder()
          .setAccentColor(0x08fff8)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('❌ Bot is already in the watchlist.')
          );
        return message.reply({ components: [already], flags: MessageFlags.IsComponentsV2 });
      }

      const watchlistEntry = new Watchlist({
        botId,
        botName: bot.username,
        guildId: message.guild.id,
        channelId,
        pingRoleId: roleId,
        lastStatusChange: new Date(),
      });
      await watchlistEntry.save();

      const added = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `✅ **Bot Added to Watchlist**\n-# ~~                                                                                                               ~~
**Bot:** ${bot.username} (${botId})
**Channel:** <#${channelId}>
**Ping Role:** ${roleId ? `<@&${roleId}>` : 'None'}\n-# ~~                                                                                                               ~~`
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('watchlist_add_ok')
              .setLabel('OK')
              .setStyle('Success')
          )
        );
      return message.reply({ components: [added], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error('Error adding bot to watchlist:', error);
      const err = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ An error occurred while adding the bot to the watchlist.')
        );
      return message.reply({ components: [err], flags: MessageFlags.IsComponentsV2 });
    }
  },

  async removeBot(message, args) {
    if (args.length < 1) {
      const usage = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ Usage:\`!watchlist remove [bot_id]\`')
        );
      return message.reply({ components: [usage], flags: MessageFlags.IsComponentsV2 });
    }
    const botId = args[0];
    try {
      const deleted = await Watchlist.findOneAndDelete({ botId, guildId: message.guild.id });
      if (!deleted) {
        const notFound = new ContainerBuilder()
          .setAccentColor(0x08fff8)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('❌ Bot not found in watchlist.')
          );
        return message.reply({ components: [notFound], flags: MessageFlags.IsComponentsV2 });
      }
      const removed = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `✅ **Bot Removed from Watchlist**\n-# ~~                                                                                                               ~~
Bot: ${deleted.botName} (${botId}) has been removed.\n-# ~~                                                                                                               ~~`
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('watchlist_remove_ok')
              .setLabel('OK')
              .setStyle('Danger')
          )
        );
      return message.reply({ components: [removed], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error('Error removing bot from watchlist:', error);
      const err = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ An error occurred while removing the bot from the watchlist.')
        );
      return message.reply({ components: [err], flags: MessageFlags.IsComponentsV2 });
    }
  },

  async listBots(message) {
    try {
      const bots = await Watchlist.find({ guildId: message.guild.id });
      if (!bots.length) {
        const none = new ContainerBuilder()
          .setAccentColor(0x08fff8)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('📝 No bots in the watchlist.')
          );
        return message.reply({ components: [none], flags: MessageFlags.IsComponentsV2 });
      }
      const options = bots.map(bot => ({
        label: bot.botName,
        value: bot.botId,
        description: `Channel: #${bot.channelId}${bot.pingRoleId ? `, Ping: @${bot.pingRoleId}` : ''}`,
      }));
      const select = new StringSelectMenuBuilder()
        .setCustomId('watchlist_bot_select')
        .setPlaceholder('Select a bot to view details')
        .addOptions(options.slice(0, 25));
      const row = new ActionRowBuilder().addComponents(select);
      const cont = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**Bot Watchlist**
Select a bot below to view details.\n-# ~~                                                                                                               ~~`)
        )
        .addActionRowComponents(row);

      return message.reply({ components: [cont], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error('Error listing bots:', error);
      const err = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ An error occurred while fetching the watchlist.')
        );
      return message.reply({ components: [err], flags: MessageFlags.IsComponentsV2 });
    }
  },

  async setChannel(message, args) {
    if (args.length < 2) {
      const usage = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ Usage:\`!watchlist setchannel [bot_id] [channel_id]\`')
        );
      return message.reply({ components: [usage], flags: MessageFlags.IsComponentsV2 });
    }
    const botId = args[0];
    const channelId = args[1];
    try {
      const channel = message.guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) {
        const invalidCh = new ContainerBuilder()
          .setAccentColor(0x08fff8)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('❌ Invalid channel ID or channel is not text-based.')
          );
        return message.reply({ components: [invalidCh], flags: MessageFlags.IsComponentsV2 });
      }
      const updated = await Watchlist.findOneAndUpdate(
        { botId, guildId: message.guild.id },
        { channelId },
        { new: true }
      );
      if (!updated) {
        const notfound = new ContainerBuilder()
          .setAccentColor(0x08fff8)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('❌ Bot not found in watchlist.')
          );
        return message.reply({ components: [notfound], flags: MessageFlags.IsComponentsV2 });
      }
      const set = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`✅ Notification channel for "${updated.botName}" set to <#${channelId}>.`)
        );
      return message.reply({ components: [set], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error('Error setting channel:', error);
      const err = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ An error occurred while setting the channel.')
        );
      return message.reply({ components: [err], flags: MessageFlags.IsComponentsV2 });
    }
  },

  async setRole(message, args) {
    if (args.length < 2) {
      const usage = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ Usage:\`!watchlist setrole [bot_id] [role_id]\`')
        );
      return message.reply({ components: [usage], flags: MessageFlags.IsComponentsV2 });
    }
    const botId = args[0];
    const roleId = args[1];
    try {
      const role = message.guild.roles.cache.get(roleId);
      if (!role) {
        const invalid = new ContainerBuilder()
          .setAccentColor(0x08fff8)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('❌ Invalid role ID.')
          );
        return message.reply({ components: [invalid], flags: MessageFlags.IsComponentsV2 });
      }
      const updated = await Watchlist.findOneAndUpdate(
        { botId, guildId: message.guild.id },
        { pingRoleId: roleId },
        { new: true }
      );
      if (!updated) {
        const notfound = new ContainerBuilder()
          .setAccentColor(0x08fff8)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('❌ Bot not found in watchlist.')
          );
        return message.reply({ components: [notfound], flags: MessageFlags.IsComponentsV2 });
      }
      const set = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`✅ Ping role for "${updated.botName}" set to <@&${roleId}>.`)
        );
      return message.reply({ components: [set], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error('Error setting role:', error);
      const err = new ContainerBuilder()
        .setAccentColor(0x08fff8)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ An error occurred while setting the role.')
        );
      return message.reply({ components: [err], flags: MessageFlags.IsComponentsV2 });
    }
  },

  async showHelp(message) {
    const help = new ContainerBuilder()
      .setAccentColor(0x08fff8)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "# **Watchlist Commands**\n" +
          "-# ~~                                                                                                               ~~\n" +
          "- \`!watchlist add [bot_id] [channel_id] [role_id]\` — Add a bot\n" +
          "- \`!watchlist remove [bot_id]\` — Remove a bot\n" +
          "- \`!watchlist list\` — Show all bots\n" +
          "- \`!watchlist setchannel [bot_id] [channel_id]\` — Set channel\n" +
          "- \`!watchlist setrole [bot_id] [role_id]\` — Set ping role\n" +
          "-# ~~                                                                                                               ~~\n" +
          "### Admin Permissions Required."
        )
      );
    return message.reply({ components: [help], flags: MessageFlags.IsComponentsV2 });
  }
};