// models/Watchlist.js
const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema({
    botId: {
        type: String,
        required: true,
        unique: true
    },
    botName: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    pingRoleId: {
        type: String,
        default: null
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastStatusChange: {
        type: Date,
        default: Date.now
    },
    totalUptime: {
        type: Number,
        default: 0
    },
    totalDowntime: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Watchlist', WatchlistSchema);
