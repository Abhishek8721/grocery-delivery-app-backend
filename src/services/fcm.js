const Notification = require('../models/Notification');

const sendPushNotification = async ({ userId = null, title, message, type = 'general' }) => {
  try {
    console.log(`[FCM Mock] Sending push notification to ${userId ? `User ${userId}` : 'ALL USERS'}: "${title}" - "${message}"`);
    
    // Save to database
    const notification = await Notification.create({
      userId,
      title,
      message,
      type
    });

    return {
      success: true,
      data: notification,
      message: 'Notification sent successfully'
    };
  } catch (error) {
    console.error('Failed to send FCM notification:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  sendPushNotification
};
