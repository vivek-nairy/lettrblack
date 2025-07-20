import { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from './useAuthUser';
import { useToast } from './use-toast';
import { 
  getMessaging, 
  getToken, 
  onMessage,
  isSupported 
} from 'firebase/messaging';
import { 
  saveFCMToken, 
  removeFCMToken,
  subscribeToUserNotifications,
  markNotificationAsRead
} from '@/lib/firestore-utils';
import { UserNotification } from '@/lib/firestore-structure';

export function useNotifications() {
  const { firebaseUser } = useAuthUser();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check if FCM is supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isSupported();
      setIsSupported(supported);
    };
    checkSupport();
  }, []);

  // Request notification permission and get FCM token
  const requestNotificationPermission = useCallback(async () => {
    if (!firebaseUser || !isSupported) return null;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY' // Replace with your VAPID key
        });
        
        if (token) {
          await saveFCMToken(firebaseUser.uid, token);
          setFcmToken(token);
          return token;
        }
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
    return null;
  }, [firebaseUser, isSupported]);

  // Handle foreground messages
  useEffect(() => {
    if (!firebaseUser || !isSupported) return;

    const messaging = getMessaging();
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show toast notification
      toast({
        title: payload.notification?.title || 'New Notification',
        description: payload.notification?.body || '',
        action: payload.data?.url ? {
          label: 'View',
          onClick: () => window.open(payload.data.url, '_blank')
        } : undefined
      });
    });

    return unsubscribe;
  }, [firebaseUser, isSupported, toast]);

  // Subscribe to user notifications
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = subscribeToUserNotifications(firebaseUser.uid, (newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, [firebaseUser]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!firebaseUser) return;
    
    await markNotificationAsRead(firebaseUser.uid, notificationId);
  }, [firebaseUser]);

  // Cleanup FCM token on unmount
  useEffect(() => {
    return () => {
      if (fcmToken) {
        removeFCMToken(fcmToken);
      }
    };
  }, [fcmToken]);

  return {
    notifications,
    fcmToken,
    isSupported,
    requestNotificationPermission,
    markAsRead
  };
} 