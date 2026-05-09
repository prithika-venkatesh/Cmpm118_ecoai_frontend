// ─────────────────────────────────────────────────────────
//  firebase.js  –  initialise Firebase once for the whole app
// ─────────────────────────────────────────────────────────
//
//  HOW TO GET YOUR CONFIG:
//  1. Go to https://console.firebase.google.com
//  2. Create a project  (e.g. "ecoai")
//  3. Click the web icon (</>)  →  register the app
//  4. Copy the config object shown  →  paste values into .env
//  5. In Firebase Console → Authentication → Sign-in method
//     → enable "Google"
//  6. In Firestore Database → Create database (start in test mode)
//
// ─────────────────────────────────────────────────────────

import { initializeApp }              from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore }               from 'firebase/firestore'

const firebaseConfig = {
  apiKey:    import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:     import.meta.env.VITE_FIREBASE_APP_ID,
}

const app      = initializeApp(firebaseConfig)
export const auth     = getAuth(app)
export const db       = getFirestore(app)
export const provider = new GoogleAuthProvider()

// Force account picker every time so users can switch accounts
provider.setCustomParameters({ prompt: 'select_account' })
