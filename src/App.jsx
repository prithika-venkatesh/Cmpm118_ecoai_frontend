// ─────────────────────────────────────────────────────────
//  App.jsx  –  Root component
//
//  Handles three states:
//    1. Loading  → checking if user is already signed in
//    2. No user  → show Login page
//    3. User OK  → show main app (Sidebar + current page)
//
//  Also loads the user's Firestore stats on sign-in and
//  creates the document if it doesn't exist yet.
// ─────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase.js'

import Login   from './pages/Login.jsx'
import Compare from './pages/Compare.jsx'
import Stats   from './pages/Stats.jsx'
import Sidebar from './components/Sidebar.jsx'
import Admin from './pages/Admin.jsx'

const ADMIN_EMAILS = ['pvenkat7@ucsc.edu']

// Default stats shape for a brand new user
const DEFAULT_STATS = {
  queries:  0,
  co2Saved: 0,
  standard: 0,
  cot:      0,
}

export default function App() {
  const [user,    setUser]    = useState(undefined)  // undefined = still loading
  const [stats,   setStats]   = useState(DEFAULT_STATS)

  useEffect(() => {
    // Firebase calls this immediately with the cached user (if any),
    // then again whenever auth state changes (sign in / sign out)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        await loadOrCreateStats(firebaseUser.uid)
      } else {
        setUser(null)
        setStats(DEFAULT_STATS)
      }
    })
    return unsubscribe   // cleanup on unmount
  }, [])

  async function loadOrCreateStats(uid) {
    try {
      const ref  = doc(db, 'users', uid)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        // Merge stored data with defaults (in case new fields added later)
        setStats({ ...DEFAULT_STATS, ...snap.data() })
      } else {
        // First time this user has signed in → create their document
        const initial = {
          ...DEFAULT_STATS,
          email:     auth.currentUser.email,
          createdAt: new Date().toISOString(),
          choices:   { standard: 0, cot: 0 },
          history:   [],
        }
        await setDoc(ref, initial)
        setStats(DEFAULT_STATS)
      }
    } catch (e) {
      console.warn('Could not load user stats from Firestore:', e.message)
      // Non-fatal — app still works, stats just won't persist
    }
  }

  // ── Still checking auth ──────────────────────────────────
  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 13,
          color: 'var(--text3)',
        }}>
          Loading…
        </div>
      </div>
    )
  }


  // ── Not signed in ────────────────────────────────────────
  if (!user) {
    return <Login />
  }

  // ── Signed in: show full app ─────────────────────────────
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        <Sidebar user={user} stats={stats} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Routes>
            <Route path="/"        element={<Navigate to="/compare" replace />} />
            <Route path="/compare" element={
              <Compare user={user} stats={stats} setStats={setStats} />
            } />
            <Route path="/stats"   element={
              <Stats stats={stats} />
            } />
             <Route path="/admin"   element={
                ADMIN_EMAILS.includes(user.email)
                  ? <Admin user={user} />
                  : <Navigate to="/compare" replace />
             } />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  )
}
