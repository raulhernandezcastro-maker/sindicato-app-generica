// firebase-messaging-sw.js
// Service Worker para notificaciones push en segundo plano

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyC1kUOV03HaTvhJ-tTUtJtY6BsCRXwSFA4",
  authDomain: "sindicato-liberty.firebaseapp.com",
  projectId: "sindicato-liberty",
  storageBucket: "sindicato-liberty.firebasestorage.app",
  messagingSenderId: "394236327667",
  appId: "1:394236327667:web:da323695cea4dcfd99e986"
})

const messaging = firebase.messaging()

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notificación en segundo plano:', payload)

  const { title, body, icon } = payload.notification || {}

  self.registration.showNotification(title || 'Sindicato Liberty', {
    body: body || 'Tienes un nuevo aviso',
    icon: icon || '/logo.png',
    badge: '/logo.png',
    data: payload.data,
    vibrate: [200, 100, 200],
  })
})
