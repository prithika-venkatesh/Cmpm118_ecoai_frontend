// ─────────────────────────────────────────────────────────
//  Sidebar.jsx  –  Left navigation panel
//  Shows: logo, status, nav links, user stats, user info
// ─────────────────────────────────────────────────────────

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { auth } from '../firebase.js'
import { signOut } from 'firebase/auth'

export default function Sidebar({ user, stats }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const isCompare = location.pathname === '/' || location.pathname === '/compare'
  const isStats   = location.pathname === '/stats'
  const isAdmin = location.pathname === '/admin'


  async function handleSignOut() {
    await signOut(auth)
  }

  // Get initials from display name  e.g. "Sankritya Rai" → "SR"
  const initials = user?.displayName
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  const navItem = (active, icon, label, onClick) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '9px 10px',
        borderRadius: 7,
        fontSize: 13,
        color: active ? 'var(--green)' : 'var(--text2)',
        background: active ? 'var(--green-muted)' : 'transparent',
        cursor: 'pointer',
        marginBottom: 2,
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
    >
      <span style={{ width: 16, textAlign: 'center', fontSize: 14 }}>{icon}</span>
      <span>{label}</span>
    </div>
  )

  return (
    <div style={{
      width: 200,
      minWidth: 200,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    }}>

      {/* Logo */}
      <div style={{
        padding: '18px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 26, height: 26,
          background: 'var(--green)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13,
        }}>🌿</div>
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '-0.5px',
        }}>EcoAI</span>
      </div>

      {/* Ollama status */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        fontSize: 12,
        color: 'var(--text2)',
        fontFamily: 'var(--mono)',
      }}>
        <div style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: 'var(--green)',
          boxShadow: '0 0 6px var(--green)',
          flexShrink: 0,
        }} />
        <span>Ollama online</span>
      </div>

      {/* Nav links */}
      <nav style={{ padding: '10px 8px', flex: 1 }}>
      {navItem(isCompare, '⇄', 'Compare', () => navigate('/compare'))}
      {navItem(isStats,   '📊', 'My Stats', () => navigate('/stats'))}
      {['pvenkat7@ucsc.edu','saarai@ucsc.edu', 'kde@ucsc.edu', 'vjallu@ucsc.edu', 'absouza@ucsc.edu'].includes(user?.email) &&
         navItem(isAdmin, '🛡️', 'Admin', () => navigate('/admin'))}    
      </nav>

      {/* Bottom: stats + user */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
      }}>
        {/* Mini stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>
              Queries
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600 }}>
              {stats.queries}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>
              CO₂ saved
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>
              {stats.co2Saved.toFixed(2)}g
            </div>
          </div>
        </div>

        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Avatar — use photo if available, else initials */}
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar"
                  style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{
                  width: 26, height: 26,
                  borderRadius: '50%',
                  background: 'var(--green-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, color: '#fff',
                }}>{initials}</div>
            }
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              {user?.displayName?.split(' ')[0] ?? 'User'}
            </span>
          </div>
          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text3)',
              cursor: 'pointer',
              fontSize: 14,
              padding: 4,
            }}
          >↩</button>
        </div>
      </div>
    </div>
  )
}
