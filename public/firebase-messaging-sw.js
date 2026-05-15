// firebase-messaging-sw.js
// Service Worker para notificaciones push en segundo plano

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyD6gE205ttKOxnoiFub7AoIteyO8-9ICcM",
  authDomain: "sindicato-generica.firebaseapp.com",
  projectId: "sindicato-generica",
  storageBucket: "sindicato-generica.firebasestorage.app",
  messagingSenderId: "553378585081",
  appId: "1:553378585081:web:180f6fc747a2bea2c88528"
})

const messaging = firebase.messaging()

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notificación en segundo plano:', payload)

  const { title, body, icon } = payload.notification || {}

  self.registration.showNotification(title || 'Mi Sindicato', {
    body: body || 'Tienes un nuevo aviso',
    icon: icon || '/logo.png',
    badge: '/logo.png',
    data: payload.data,
    vibrate: [200, 100, 200],
  })
})
