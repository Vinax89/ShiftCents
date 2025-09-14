import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

function ensureApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig as any)
}

const firebaseApp = ensureApp()
const app = firebaseApp
const auth: Auth = getAuth(firebaseApp)
let db: Firestore = getFirestore(firebaseApp)

if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db)
      .then(() => console.log('Firestore persistence enabled'))
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
          console.log('Firestore persistence not available');
        }
      });
  } catch (error) {
    console.error("Error enabling Firestore persistence:", error);
  }
}

export { firebaseApp, app, auth, db }

export async function getAuthLazy(): Promise<Auth> {
  const { getAuth } = await import('firebase/auth')
  return getAuth(firebaseApp)
}
export async function getFirestoreLazy(): Promise<Firestore> {
  const { getFirestore } = await import('firebase/firestore')
  return getFirestore(firebaseApp)
}
