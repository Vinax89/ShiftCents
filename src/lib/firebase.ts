import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore'

const firebaseConfig = {
  "projectId": "studio-7818144568-e6f2b",
  "appId": "1:575946598737:web:2cf21d158139cea2b20b70",
  "storageBucket": "studio-7818144568-e6f2b.appspot.com",
  "apiKey": "AIzaSyDR8_qe_k6lSr1-_dbDFar_oMdU4kANRpQ",
  "authDomain": "studio-7818144568-e6f2b.firebaseapp.com",
  "messagingSenderId": "575946598737"
};


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
