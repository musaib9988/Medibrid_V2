importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBJ2PSl0iCwyFgpW5WLkgmJffOikRZfCLI",
  authDomain: "musaib0.firebaseapp.com",
  projectId: "musaib0",
  storageBucket: "musaib0.firebasestorage.app",
  messagingSenderId: "813318556366",
  appId: "1:813318556366:web:ad9e458eeb2ca93c2f9e9f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload?.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload?.notification?.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
