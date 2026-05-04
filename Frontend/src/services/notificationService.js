// Frontend/src/services/notificationService.js
import client from "../api/client";// ඔයාගේ axios instance එක

// User ට අදාළ notifications සියල්ල ලබා ගැනීම
// Fetch notifications for the logged-in user (no tokenNumber needed)
export const getNotifications = async () => {
  try {
    const { data } = await client.get(`/notifications`);
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

// එක notification එකක් read ලෙස mark කිරීම
export const markNotificationAsRead = async (id) => {
  try {
    const { data } = await client.patch(`/notifications/${id}/read`);
    return data.success;
  } catch (error) {
    console.error("Error marking as read:", error);
    return false;
  }
};

// සියල්ලම read ලෙස mark කිරීම
export const markAllNotificationsAsRead = async () => {
  try {
    const { data } = await client.post(`/notifications/mark-all-read`);
    return data.success;
  } catch (error) {
    console.error("Error marking all as read:", error);
    return false;
  }
};