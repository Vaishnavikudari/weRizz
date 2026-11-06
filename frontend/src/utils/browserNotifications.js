/**
 * browserNotifications.js
 * Native Web Notifications API helper for Mavora.
 * Enables native Chrome / Windows / Mac / Android OS-level system notifications
 * when family members push alerts, reminders, or emergency notifications.
 */

export const isNotificationSupported = () => {
    return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission;
};

export const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
        console.warn('[Notifications] Native browser notifications are not supported in this environment.');
        return 'unsupported';
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            sendChromeNotification({
                title: '🔔 Mavora Alerts Enabled',
                body: 'You will now receive instant Chrome notifications whenever your family sends an alert or reminder.',
                tag: 'mavora-welcome',
                requireInteraction: false
            });
        }
        return permission;
    } catch (error) {
        console.error('[Notifications] Permission request error:', error);
        return Notification.permission;
    }
};

/**
 * Dispatches a native Chrome/OS system notification.
 * Works even when Chrome is minimized or in the background.
 */
export const sendChromeNotification = ({
    title = '🚨 Mavora Family Alert',
    body = 'Your family has sent an alert to your device.',
    icon = '/assets/glowing_brain.png',
    tag = 'mavora-general-alert',
    requireInteraction = true,
    onClick = null
} = {}) => {
    if (!isNotificationSupported()) {
        console.warn('[Notifications] Browser notifications not supported.');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.log('[Notifications] Permission not granted yet (current status:', Notification.permission, ')');
        return null;
    }

    try {
        const options = {
            body,
            icon,
            tag,
            renotify: true,
            requireInteraction, // Stays visible until user clicks or dismisses
            silent: false
        };

        // Try vibrating mobile devices if supported
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate([300, 150, 300, 150, 400]);
            } catch (ve) {}
        }

        const notification = new Notification(title, options);

        notification.onclick = (event) => {
            event.preventDefault();
            try {
                window.focus();
            } catch (fe) {}
            if (typeof onClick === 'function') {
                onClick();
            }
            notification.close();
        };

        return notification;
    } catch (err) {
        console.warn('[Notifications] Error creating native notification:', err);
        return null;
    }
};
