// ─────────────────────────────────────────────────────────
//  Admin.jsx  –  Admin dashboard: see all users + stats
//  Only accessible to the admin UID
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import { db } from '../firebase.js'
import { collection, getDocs } from 'firebase/firestore'

const ADMIN_EMAILS = ['pvenkat7@ucsc.edu']

export default function Admin({ user }) {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)

  // Block non-admins
  if (!ADMIN_EMAILS.includes(user.email)) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13,
      }}>
        ⛔ Access denied
      </div>
    )
  }

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(collection(db, 'users'))
        const data = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
        // Sort by queries descending
        data.sort((a, b) => (b.queries || 0) - (a.queries || 0))
        setUsers(data)
      } catch (e) {
        console.error('Failed to fetch users:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // Aggregate stats
  const totalUsers   = users.length
  const totalQueries = users.reduce((s, u) => s + (u.queries || 0), 0)
  const totalCO2     = users.reduce((s, u) => s + (u.co2Saved || 0), 0)
  const totalStd     = users.reduce((s, u) => s + (u.choices?.standard || 0), 0)
  const totalCot     = users.reduce((s, u) => s + (u.choices?.cot || 0), 0)

  const statCard = (label, value, sub) => (
    <div style={{
      background: 'var(--bg3)',
      border: '1px solid var(--border2)',
      borderRadius: 10,
      padding: '16px 20px',
      minWidth: 140,
      flex: 1,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--mono)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '28px 32px',
      fontFamily: 'var(--sans)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Admin Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
          All registered users and their activity
        </p>
      </div>

      {/* Aggregate stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {statCard('TOTAL USERS', totalUsers)}
        {statCard('TOTAL QUERIES', totalQueries)}
        {statCard('CO₂ SAVED', `${totalCO2.toFixed(2)}g`)}
        {statCard('STANDARD CHOSEN', totalStd, `${totalQueries ? Math.round(totalStd/totalQueries*100) : 0}% of choices`)}
        {statCard('COT CHOSEN', totalCot, `${totalQueries ? Math.round(totalCot/totalQueries*100) : 0}% of choices`)}
      </div>

      {/* Users table */}
      {loading ? (
        <div style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          Loading users…
        </div>
      ) : (
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.5fr',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text3)',
            fontFamily: 'var(--mono)',
            letterSpacing: '0.5px',
          }}>
            <span>EMAIL</span>
            <span>QUERIES</span>
            <span>CO₂ SAVED</span>
            <span>STANDARD</span>
            <span>COT</span>
            <span>HISTORY</span>
          </div>

          {/* User rows */}
          {users.map((u, i) => (
            <div key={u.uid}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.5fr',
                  padding: '12px 16px',
                  borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: 13,
                  color: 'var(--text2)',
                  alignItems: 'center',
                  background: expanded === u.uid ? 'var(--bg3)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                  {u.email || '—'}
                </span>
                <span style={{ color: 'var(--green)', fontWeight: 500 }}>
                  {u.queries || 0}
                </span>
                <span>{(u.co2Saved || 0).toFixed(4)}g</span>
                <span>{u.choices?.standard || 0}</span>
                <span>{u.choices?.cot || 0}</span>
                <button
                  onClick={() => setExpanded(expanded === u.uid ? null : u.uid)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border2)',
                    color: 'var(--text3)',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {expanded === u.uid ? '▲' : '▼'}
                </button>
              </div>

              {/* Expanded history */}
              {expanded === u.uid && u.history && u.history.length > 0 && (
                <div style={{
                  padding: '12px 20px 16px',
                  borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'var(--bg3)',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 8 }}>
                    QUERY HISTORY
                  </div>
                  {[...u.history].reverse().map((h, j) => (
                    <div key={j} style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      padding: '6px 0',
                      borderBottom: j < u.history.length - 1 ? '1px solid var(--border)' : 'none',
                      fontSize: 12,
                    }}>
                      <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 3,
                        background: h.chosen === 'standard' ? '#1a3a5c' : '#2d1a4a',
                        color: h.chosen === 'standard' ? '#60a5fa' : '#c084fc',
                        whiteSpace: 'nowrap',
                        marginTop: 1,
                      }}>
                        {h.chosen === 'standard' ? '⚡ STD' : '🧠 COT'}
                      </span>
                      <span style={{ color: 'var(--text2)', flex: 1 }}>{h.prompt}</span>
                      <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 10, whiteSpace: 'nowrap' }}>
                        {h.timestamp ? new Date(h.timestamp).toLocaleDateString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}