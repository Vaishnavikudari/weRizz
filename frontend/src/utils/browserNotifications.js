/**
 * browserNotifications.js
 * Native Web Notifications API helper for Mavora.
 * Supports BOTH Desktop (Chrome/Edge/Firefox/Mac) AND Mobile (Android Chrome/Samsung Internet).
 * Mobile Chrome requires ServiceWorkerRegistration.showNotification().
 */

export const isNotificationSupported = () => {
    return typeof window !== 'undefined' && ('Notification' in window || 'serviceWorker' in navigator);
};

export const getNotificationPermission = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

/**
 * Registers the background service worker needed for mobile Chrome push notifications.
 */
export const initServiceWorker = async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            console.log('[SW] Service Worker registered with scope:', reg.scope);
            return reg;
        } catch (err) {
            console.warn('[SW] Registration notice:', err);
        }
    }
    return null;
};

// Auto-register service worker on startup
if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') {
        initServiceWorker();
    } else {
        window.addEventListener('load', () => {
            initServiceWorker();
        });
    }
}

export const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
        console.warn('[Notifications] Native browser notifications are not supported in this environment.');
        return 'unsupported';
    }

    // Make sure service worker is ready for mobile
    await initServiceWorker();

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await sendChromeNotification({
                title: '🔔 Mavora Alerts Enabled',
                body: 'You will now receive instant notifications on this phone whenever family sends an alert or reminder.',
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
 * Dispatches a native Chrome system notification.
 * Works on Mobile (via Service Worker) and Desktop (via Notification constructor or SW).
 */
export const sendChromeNotification = async ({
    title = '🚨 Mavora Family Alert',
    body = 'Your family has sent an alert to your device.',
    icon = '/assets/glowing_brain.png',
    tag = 'mavora-general-alert',
    requireInteraction = true,
    onClick = null
} = {}) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('[Notifications] Browser notifications not supported.');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.log('[Notifications] Permission not granted yet (current status:', Notification.permission, ')');
        return null;
    }

    // Mobile vibration pattern: buzz-pause-buzz
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            navigator.vibrate([300, 150, 300, 150, 400]);
        } catch (ve) {}
    }

    const options = {
        body,
        icon,
        badge: icon,
        tag,
        renotify: true,
        requireInteraction, // Stays visible until user clicks or dismisses
        silent: false,
        vibrate: [300, 150, 300, 150, 400],
        data: {
            url: typeof window !== 'undefined' ? window.location.href : '/'
        }
    };

    // 1. MOBILE CHROME REQUIREMENT: Service Worker showNotification()
    // Chrome for Android explicitly forbids 'new Notification()' and throws TypeError: Illegal Constructor.
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
            let reg = await navigator.serviceWorker.getRegistration();
            if (!reg) {
                reg = await initServiceWorker();
            }
            if (reg && reg.showNotification) {
                await reg.showNotification(title, options);
                console.log('[Notifications] Mobile ServiceWorker notification sent successfully:', title);
                return reg;
            }
        } catch (swErr) {
            console.warn('[Notifications] ServiceWorker showNotification notice:', swErr);
        }
    }

    // 2. DESKTOP FALLBACK: Standard Notification API
    try {
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
        console.warn('[Notifications] Standard Notification constructor note:', err);
        return null;
    }
};
