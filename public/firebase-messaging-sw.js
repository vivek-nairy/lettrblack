// Firebase messaging service worker for push notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxGQoBzXzXzXzXzXzXzXzXzXzXzXzXzXz",
  authDomain: "lettrblack.firebaseapp.com",
  projectId: "lettrblack",
  storageBucket: "lettrblack.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'LettrBlack';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/LettrBlack_logo.png',
    badge: '/LettrBlack_logo.png',
    tag: 'lettrblack-notification',
    data: payload.data || {},
    actions: [
      {
        action: 'join',
        title: 'Join Call',
        icon: '/LettrBlack_logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'join' || !event.action) {
    // Open the app and navigate to the call
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(window.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
}); 