import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)

// Messaging solo funciona en navegadores que lo soporten
let messaging = null
try {
  messaging = getMessaging(app)
} catch (err) {
  console.warn('[FCM] Messaging no soportado en este entorno:', err.message)
}

// Solicitar permiso y obtener token FCM
export const requestNotificationPermission = async () => {
  if (!messaging) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('[FCM] Permiso denegado')
      return null
    }
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    })
    return token
  } catch (err) {
    console.error('[FCM] Error obteniendo token:', err)
    return null
  }
}

// Escuchar mensajes cuando la app está en primer plano
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}

export { messaging }
