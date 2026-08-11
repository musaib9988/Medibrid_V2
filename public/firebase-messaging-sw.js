importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "dummy",
  projectId: "dummy",
  messagingSenderId: "123456789",
  appId: "dummy"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload?.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload?.notification?.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
