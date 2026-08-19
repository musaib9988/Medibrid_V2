import { Capacitor } from '@capacitor/core';
import { PushNotifications, ActionPerformed, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';

export interface PushNotificationPayload {
  id?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  receivedAt?: number;
}

type NotificationCallback = (payload: PushNotificationPayload) => void;
type TokenCallback = (token: string) => void;

class PushNotificationService {
  private isInitialized = false;
  private tokenListeners: TokenCallback[] = [];
  private notificationListeners: NotificationCallback[] = [];
  private actionListeners: ((action: ActionPerformed) => void)[] = [];

  /**
   * Initializes Capacitor native push channels and persistent listeners.
   */
  public async initNativePush(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (Capacitor.isNativePlatform()) {
      try {
        // 1. Create high-importance Android Notification Channel
        await PushNotifications.createChannel({
          id: 'medibrid_high_importance',
          name: 'MediBrid Healthcare Notifications',
          description: 'High-priority alerts for appointment confirmations, OPD queues, and clinic updates',
          importance: 5, // High Importance (Heads-up / Pop on screen)
          visibility: 1, // Public
          sound: 'default',
          vibration: true,
          lights: true,
          lightColor: '#0D9488'
        });

        // 2. Request Permissions
        const permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          const req = await PushNotifications.requestPermissions();
          if (req.receive === 'granted') {
            await PushNotifications.register();
          }
        } else if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }

        // 3. Listener: Registration Token
        await PushNotifications.addListener('registration', (token: Token) => {
          console.log('[Native Push] Registration successful, token:', token.value);
          localStorage.setItem('medibrid_native_push_token', token.value);
          this.tokenListeners.forEach(cb => cb(token.value));
        });

        // 4. Listener: Registration Error
        await PushNotifications.addListener('registrationError', (error: any) => {
          console.warn('[Native Push] Registration error:', error);
        });

        // 5. Listener: Push Notification Received in Foreground/Background
        await PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
          console.log('[Native Push] Push received:', notification);
          
          const payload: PushNotificationPayload = {
            id: notification.id,
            title: notification.title || 'MediBrid Update',
            body: notification.body || '',
            data: notification.data || {},
            receivedAt: Date.now()
          };

          // If app is in foreground, trigger high-priority local notification or UI banner
          try {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: payload.title,
                  body: payload.body,
                  id: Date.now() % 100000,
                  channelId: 'medibrid_high_importance',
                  extra: payload.data
                }
              ]
            });
          } catch (e) {
            console.warn('[Native Push] LocalNotification schedule notice:', e);
          }

          this.notificationListeners.forEach(cb => cb(payload));
        });

        // 6. Listener: Notification Action Performed (Tapped when terminated or in background)
        await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
          console.log('[Native Push] Action performed (app opened from notification):', action);
          this.actionListeners.forEach(cb => cb(action));
        });

        // 7. App State Change Listener (Detect Resume from Background/Terminated)
        await App.addListener('appStateChange', ({ isActive }) => {
          console.log('[Native App] State changed, isActive:', isActive);
          if (isActive) {
            this.syncPendingNotifications();
          }
        });

      } catch (err) {
        console.warn('[Native Push] Initialization notice:', err);
      }
    } else {
      // Web / PWA Environment - Set up message listener for SW background updates
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
            console.log('[Web Push SW] Notification clicked:', event.data);
            const payload = event.data.data;
            if (payload) {
              this.notificationListeners.forEach(cb => cb({
                title: payload.title || 'MediBrid Update',
                body: payload.body || '',
                data: payload.rawPayload || {}
              }));
            }
          }
        });
      }
    }
  }

  /**
   * Syncs any notifications that were received and cached while app was closed.
   */
  public async syncPendingNotifications(): Promise<PushNotificationPayload[]> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.status === 'ok') {
            resolve(event.data.notifications || []);
          } else {
            resolve([]);
          }
        };

        navigator.serviceWorker.controller?.postMessage(
          { type: 'GET_BACKGROUND_NOTIFICATIONS' },
          [messageChannel.port2]
        );

        // Timeout fallback
        setTimeout(() => resolve([]), 1500);
      });
    }
    return [];
  }

  public onToken(callback: TokenCallback) {
    this.tokenListeners.push(callback);
    const existing = localStorage.getItem('medibrid_native_push_token');
    if (existing) callback(existing);
  }

  public onNotificationReceived(callback: NotificationCallback) {
    this.notificationListeners.push(callback);
  }

  public onNotificationAction(callback: (action: ActionPerformed) => void) {
    this.actionListeners.push(callback);
  }
}

export const pushService = new PushNotificationService();
