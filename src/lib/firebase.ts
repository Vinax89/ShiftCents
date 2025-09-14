// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "studio-7818144568-e6f2b",
  "appId": "1:575946598737:web:2cf21d158139cea2b20b70",
  "storageBucket": "studio-7818144568-e6f2b.appspot.com",
  "apiKey": "AIzaSyDR8_qe_k6lSr1-_dbDFar_oMdU4kANRpQ",
  "authDomain": "studio-7818144568-e6f2b.firebaseapp.com",
  "messagingSenderId": "575946598737"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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

export { app, auth, db, storage };
