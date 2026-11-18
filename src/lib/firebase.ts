import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { firebaseConfigured, firebaseOptions } from './firebaseConfig'

let app: FirebaseApp | undefined

function firebaseApp(): FirebaseApp {
  if (!firebaseConfigured) {
    throw new Error('Firebase 설정값이 없습니다. .env.example 을 참고해 .env.local 을 만드세요.')
  }
  app ??= initializeApp(firebaseOptions)
  return app
}

export const auth = (): Auth => getAuth(firebaseApp())
export const db = (): Firestore => getFirestore(firebaseApp())
