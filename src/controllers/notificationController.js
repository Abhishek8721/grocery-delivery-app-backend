const Notification = require('../models/Notification');
const { sendPushNotification } = require('../services/fcm');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { userId: req.user.id },
        { userId: null }
      ]
    }).sort({ createdAt: -1 }).limit(30);

    return res.json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { _id: req.params.id },
      { $set: { isRead: true } }
    );
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminSendNotification = async (req, res) => {
  try {
    const { title, message, targetAudience = 'All Customers', selectedUserId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and Message are required.' });
    }

    const targetUserId = targetAudience === 'Selected Customers' ? selectedUserId : null;

    const result = await sendPushNotification({
      userId: targetUserId,
      title,
      message,
      type: 'promo'
    });

    return res.json({
      success: true,
      message: `Notification dispatched successfully to ${targetAudience}`,
      data: result.data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  adminSendNotification
};
