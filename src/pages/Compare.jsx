// ─────────────────────────────────────────────────────────
//  Compare.jsx  –  Main page: prompt input → side-by-side
//                  model responses with resource cards
// ─────────────────────────────────────────────────────────

import React, { useState, useRef } from 'react'
import ResourceCard   from '../components/ResourceCard.jsx'
import { queryBothModels } from '../api/ollama.js'
import { calcCO2Saved }    from '../api/carbon.js'
import { db }              from '../firebase.js'
import { doc, updateDoc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore'

export default function Compare({ user, stats, setStats }) {
  const [prompt,   setPrompt]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [results,  setResults]  = useState(null)   // { prompt, standard, cot }
  const [chosen,   setChosen]   = useState(null)   // 'standard' | 'cot'
  const textareaRef = useRef(null)

  // ── Submit prompt to both models ─────────────────────────
  async function handleSubmit() {
    const trimmed = prompt.trim()
    if (!trimmed || loading) return
    setError('')
    setLoading(true)
    setResults(null)
    setChosen(null)

    try {
      const data = await queryBothModels(trimmed)
      setResults({ prompt: trimmed, ...data })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Allow Shift+Enter for newline, plain Enter to submit
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ── User picks a response ────────────────────────────────
  async function handleChoose(which) {
    if (chosen) return   // already chosen
    setChosen(which)

    const saved = calcCO2Saved(
      results.standard.co2_g,
      results.cot.co2_g,
      which
    )

    // Update local stats immediately (optimistic update)
    setStats(prev => ({
      ...prev,
      queries:  prev.queries + 1,
      co2Saved: parseFloat((prev.co2Saved + saved).toFixed(4)),
      [which]:  prev[which] + 1,
    }))

    // Persist to Firestore
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        queries:  increment(1),
        co2Saved: increment(saved),
        [`choices.${which}`]: increment(1),
        history: arrayUnion({
          prompt:   results.prompt,
          chosen:   which,
          co2Saved: saved,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (e) {
      console.warn('Firestore update failed:', e.message)
      // Non-fatal — stats still updated locally
    }
  }

  function handleNewQuery() {
    setResults(null)
    setChosen(null)
    setPrompt('')
    setError('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  // ── Render: Input screen ─────────────────────────────────
  if (!results && !loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 60px',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, marginBottom: 8, textAlign: 'center' }}>
          Compare two AI responses
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 32, textAlign: 'center' }}>
          See the carbon cost of thinking — choose the answer you prefer
        </p>

        <div style={{
          width: '100%', maxWidth: 700,
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          borderRadius: 12,
          padding: '16px 18px',
        }}>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… e.g. Why is SSH security important?"
            rows={4}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontFamily: 'var(--sans)',
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'none',
              width: '100%',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              ⚡ llama3.2:1b  vs  qwen2.5:1.5b
            </span>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              style={{
                background: prompt.trim() ? 'var(--green)' : 'var(--green-muted)',
                border: 'none',
                color: '#fff',
                padding: '9px 20px',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'var(--sans)',
                cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
            >
              Compare →
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 16,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 13,
            color: '#fca5a5',
            maxWidth: 700,
            width: '100%',
          }}>
            ⚠ {error}
          </div>
        )}
      </div>
    )
  }

  // ── Render: Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: 'var(--green)',
              animation: 'bounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text3)' }}>
          Querying both models in parallel…
        </span>
      </div>
    )
  }

  // ── Render: Results (side-by-side) ───────────────────────
  const isStandardEfficient = results.standard.co2_g <= results.cot.co2_g

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Prompt bar at top */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
        fontFamily: 'var(--mono)',
        fontSize: 13,
        color: 'var(--text2)',
      }}>
        <span style={{ color: 'var(--green)', marginRight: 8 }}>❯</span>
        {results.prompt}
      </div>

      {/* Two columns */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        overflow: 'hidden',
      }}>
        {[
          { key: 'standard', label: '⚡ STANDARD',       modelName: 'llama3.2:1b',  badgeColor: '#1a3a5c', badgeText: '#60a5fa', btnColor: 'var(--green)' },
          { key: 'cot',      label: '🧠 CHAIN-OF-THOUGHT', modelName: 'qwen2.5:1.5b', badgeColor: '#2d1a4a', badgeText: '#c084fc', btnColor: 'var(--amber)' },
        ].map(({ key, label, modelName, badgeColor, badgeText, btnColor }) => {
          const data = results[key]
          const isEfficient = key === 'standard' ? isStandardEfficient : !isStandardEfficient

          return (
            <div
              key={key}
              style={{
                borderRight: key === 'standard' ? '1px solid var(--border)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                padding: 20,
                gap: 16,
                overflowY: 'auto',
              }}
            >
              {/* Column header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingBottom: 12,
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  background: badgeColor,
                  color: badgeText,
                  border: `1px solid ${badgeText}33`,
                }}>{label}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  {modelName}
                </span>
              </div>

              {/* Response text */}
              <div style={{
                fontSize: 13,
                lineHeight: 1.75,
                color: 'var(--text2)',
                flex: 1,
                whiteSpace: 'pre-wrap',
              }}>
                {data.text}
              </div>

              {/* Resource card */}
              <ResourceCard data={data} isEfficient={isEfficient} />

              {/* Choose button */}
              <button
                onClick={() => handleChoose(key)}
                disabled={!!chosen}
                style={{
                  width: '100%',
                  padding: 13,
                  borderRadius: 8,
                  border: 'none',
                  background: chosen === key
                    ? btnColor
                    : chosen
                      ? 'var(--bg3)'
                      : btnColor,
                  color: chosen && chosen !== key ? 'var(--text3)' : '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'var(--sans)',
                  cursor: chosen ? 'default' : 'pointer',
                  opacity: chosen && chosen !== key ? 0.4 : 1,
                  transition: 'all 0.2s',
                  letterSpacing: '0.2px',
                }}
              >
                {chosen === key ? '✓ Chosen' : 'Choose this answer'}
              </button>
            </div>
          )
        })}
      </div>

      {/* New query bar at bottom */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg2)',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <button
          onClick={handleNewQuery}
          style={{
            background: 'transparent',
            border: '1px solid var(--border2)',
            color: 'var(--text2)',
            padding: '8px 20px',
            borderRadius: 20,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'var(--sans)',
            transition: 'all 0.15s',
          }}
        >
          + New query
        </button>
      </div>
    </div>
  )
}
