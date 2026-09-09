const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null means broadcast to all
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['order', 'promo', 'system', 'general'], default: 'general' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
