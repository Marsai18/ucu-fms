import db from '../utils/db.js';

export const getNotifications = async (req, res, next) => {
  try {
    const filters = {};
    if (req.user?.role === 'driver' && req.user?.driverId) {
      filters.recipientRole = 'driver';
      filters.driverId = req.user.driverId;
    } else if (req.user?.role === 'client') {
      filters.userId = req.user.id;
      filters.recipientRole = 'client';
    } else if (req.user?.role === 'hod') {
      filters.recipientRole = 'hod';
      filters.currentUserId = req.user?.id;
    } else if (req.user?.role === 'admin' || req.user?.username === 'masai') {
      filters.recipientRole = 'admin';
      filters.currentUserId = req.user?.id;
    } else {
      return res.json([]);
    }
    const notifications = await db.findAllNotifications(filters);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await db.findNotificationById(id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    // Verify user is allowed to mark this notification (owns it)
    const hodOk =
      req.user?.role === 'hod' &&
      notification.recipientRole === 'hod' &&
      (!notification.recipientUserId ||
        String(notification.recipientUserId) === String(req.user?.id));
    const adminOk =
      (req.user?.role === 'admin' || req.user?.username === 'masai') &&
      notification.recipientRole === 'admin' &&
      (!notification.recipientUserId ||
        String(notification.recipientUserId) === String(req.user?.id));
    const canAccess =
      (req.user?.role === 'driver' && req.user?.driverId && String(notification.driverId) === String(req.user.driverId) && notification.recipientRole === 'driver') ||
      (req.user?.role === 'client' && String(notification.userId) === String(req.user?.id) && notification.recipientRole === 'client') ||
      hodOk ||
      adminOk;
    if (!canAccess) return res.status(403).json({ error: 'Not allowed to access this notification' });
    const updated = await db.updateNotification(id, { read: true });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    if (req.user?.role === 'driver' && req.user?.driverId) {
      await db.markNotificationsRead(null, 'driver', req.user.driverId);
    } else if (req.user?.role === 'client') {
      await db.markNotificationsRead(req.user?.id, 'client', null);
    } else if (req.user?.role === 'hod') {
      await db.markNotificationsRead(null, 'hod', null, req.user?.id);
    } else if (req.user?.role === 'admin' || req.user?.username === 'masai') {
      await db.markNotificationsRead(null, 'admin', null, req.user?.id);
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};
