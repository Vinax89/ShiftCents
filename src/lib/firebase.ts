
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

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;


function ensureApp(): FirebaseApp | null {
    if (firebaseApp) return firebaseApp;
    if (getApps().length) {
        firebaseApp = getApp();
    } else if (firebaseConfig.apiKey) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        console.warn("Firebase config is missing, app functionality will be limited.");
    }
    return firebaseApp;
}

try {
    const app = ensureApp();
    if (app) {
        auth = getAuth(app);
        db = getFirestore(app);
        if (typeof window !== 'undefined') {
            enableIndexedDbPersistence(db).catch((err) => {
              if (err.code == 'failed-precondition') {
                console.warn('Firestore persistence can only be enabled in one tab at a time.');
              } else if (err.code == 'unimplemented') {
                console.log('Firestore persistence is not available in this browser.');
              }
            });
        }
    }
} catch (e) {
    console.error("Error initializing Firebase:", e);
}


const app = firebaseApp;
export { firebaseApp, app, auth, db }

export async function getAuthLazy(): Promise<Auth | null> {
  const app = ensureApp();
  if (!app) return null;
  const { getAuth } = await import('firebase/auth')
  return getAuth(app)
}
export async function getFirestoreLazy(): Promise<Firestore | null> {
  const app = ensureApp();
  if (!app) return null;
  const { getFirestore } = await import('firebase/firestore')
  return getFirestore(app)
}
