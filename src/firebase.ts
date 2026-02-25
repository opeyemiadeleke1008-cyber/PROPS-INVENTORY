import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAH8rpb4vaqLx0YC-iJV9FWAa4s1pFfipU',
  authDomain: 'props-inventory.firebaseapp.com',
  projectId: 'props-inventory',
  storageBucket: 'props-inventory.firebasestorage.app',
  messagingSenderId: '131654930319',
  appId: '1:131654930319:web:3417072f9173c0f60d85fa',
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
