// ─────────────────────────────────────────────────────────
//  Login.jsx  –  Google sign-in page
//
//  Flow:
//    1. User clicks "Sign in with Google"
//    2. Firebase opens Google's account picker
//    3. We check the email ends in @ucsc.edu
//    4. If not → sign them out immediately + show error
//    5. If yes → App.jsx detects the auth state change
//               and redirects to /compare automatically
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { signInWithPopup }  from 'firebase/auth'
import { auth, provider }   from '../firebase.js'

// Change this to your school's domain if needed
const ALLOWED_DOMAIN = '@ucsc.edu'

export default function Login() {
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setError('')
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, provider)
      const email  = result.user.email ?? ''

      if (!email.endsWith(ALLOWED_DOMAIN)) {
        // Sign them right back out — they don't have access
        await auth.signOut()
        setError(`Only ${ALLOWED_DOMAIN} email addresses are allowed.`)
      }
      // If email is fine, App.jsx's onAuthStateChanged fires
      // and automatically routes to /compare — nothing else needed here
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 0,
      padding: 24,
    }}>

      {/* Card */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
      }}>

        {/* Logo */}
        <div style={{
          width: 56, height: 56,
          background: 'var(--green)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
          margin: '0 auto 20px',
        }}>🌿</div>

        <h1 style={{
          fontFamily: 'var(--mono)',
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: '-1px',
          marginBottom: 8,
        }}>EcoAI</h1>

        <p style={{
          fontSize: 14,
          color: 'var(--text3)',
          marginBottom: 10,
          lineHeight: 1.5,
        }}>
          Compare AI responses and track<br />your carbon footprint
        </p>

        <div style={{
          display: 'inline-block',
          background: 'var(--green-muted)',
          border: '1px solid var(--border2)',
          borderRadius: 20,
          padding: '4px 12px',
          fontSize: 11,
          fontFamily: 'var(--mono)',
          color: 'var(--green)',
          marginBottom: 32,
        }}>
          UCSC students only
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#fca5a5',
            marginBottom: 20,
            textAlign: 'left',
          }}>
            {error}
          </div>
        )}

        {/* Google Sign-in button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px 20px',
            background: loading ? 'var(--green-muted)' : 'var(--green)',
            border: 'none',
            borderRadius: 9,
            color: '#fff',
            fontSize: 15,
            fontWeight: 500,
            fontFamily: 'var(--sans)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'background 0.15s',
          }}
        >
          {/* Google "G" icon via SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#fff" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="rgba(255,255,255,0.8)" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="rgba(255,255,255,0.6)" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="rgba(255,255,255,0.9)" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <p style={{
          fontSize: 11,
          color: 'var(--text3)',
          marginTop: 16,
          lineHeight: 1.5,
        }}>
          Use your @ucsc.edu Google account.<br />
          Other accounts will be rejected.
        </p>
      </div>
    </div>
  )
}
