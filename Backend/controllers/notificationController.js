import Notification from "../models/Notification.js";

// Notification එකක් create කරන පොදු function එක
export const createNotification = async ({ tenantType, tokenNumber, title, message, type, module, userId }) => {
  try {
    const newNotification = new Notification({
      tenantType,
      tokenNumber,
      title,
      message,
      type,
      module,
      userId
    });
    await newNotification.save();
    console.log(`Notification created for ${tokenNumber} (user: ${userId})`);
  } catch (error) {
    console.error("Error creating notification:", error.message);
  }
};

// User ට අදාළ notifications ලබා ගැනීම
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;

    const query = { userId, isRead: false };
    
    // දැනට tenantType එක නැති වුණත් userId එක තියෙනවා නම් notifications පෙන්නන්න
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID missing in request." });
    }

    // දැනට userId එකෙන් විතරක් find කරලා බලමු වැඩේද කියලා
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Notification එකක් 'Read' ලෙස mark කිරීම
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// සියල්ලම 'Read' ලෙස mark කිරීම
export const markAllAsRead = async (req, res) => {
  try {
    
    const userId = req.user?.id;

    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    
    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};