// ─────────────────────────────────────────────────────────
//  Stats.jsx  –  "My Stats" dashboard
//  Shows the user their query count, CO₂ saved, and model
//  preference breakdown, plus global platform totals
// ─────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import { db } from '../firebase.js'
import { collection, getAggregateFromServer, sum, count } from 'firebase/firestore'

export default function Stats({ stats }) {
  const [global, setGlobal] = useState(null)

  // Pull aggregate global stats from Firestore once on mount
  useEffect(() => {
    async function loadGlobal() {
      try {
        const usersRef = collection(db, 'users')
        const snapshot = await getAggregateFromServer(usersRef, {
          totalQueries:  sum('queries'),
          totalCO2:      sum('co2Saved'),
          totalStandard: sum('choices.standard'),
          totalCot:      sum('choices.cot'),
        })
        const d = snapshot.data()
        setGlobal({
          queries:  d.totalQueries  ?? 0,
          co2:      d.totalCO2      ?? 0,
          standard: d.totalStandard ?? 0,
          cot:      d.totalCot      ?? 0,
        })
      } catch (e) {
        // Aggregate queries need Firestore indexes in some configs
        // Fall back to zeros if unavailable
        console.warn('Could not load global stats:', e.message)
        setGlobal({ queries: 0, co2: 0, standard: 0, cot: 0 })
      }
    }
    loadGlobal()
  }, [])

  const totalChoices  = (stats.standard ?? 0) + (stats.cot ?? 0)
  const standardPct   = totalChoices > 0 ? Math.round((stats.standard / totalChoices) * 100) : 0
  const cotPct        = 100 - standardPct

  const card = (icon, value, label, valueColor) => (
    <div style={{
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
      <div style={{
        fontSize: 26,
        fontWeight: 600,
        fontFamily: 'var(--mono)',
        color: valueColor ?? 'var(--text)',
        marginBottom: 4,
      }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</div>
    </div>
  )

  const prefBar = (icon, name, count, pct, color) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 7 }}>
          {icon} {name}
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color }}>
          {count} ({pct}%)
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>
        Your Usage Stats
      </h1>

      {/* Top 3 summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
        marginBottom: 20,
      }}>
        {card('💬', stats.queries,              'Total Queries')}
        {card('🌱', `${stats.co2Saved.toFixed(4)}g`, 'CO₂ Saved', 'var(--green)')}
        {card('🧠', `${cotPct}%`,               'CoT Preference', 'var(--amber)')}
      </div>

      {/* Model preferences */}
      <div style={{
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '2px',
          color: 'var(--text3)',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}>Model Preferences</div>

        {prefBar('⚡', 'Standard',        stats.standard ?? 0, standardPct, 'var(--green)')}
        {prefBar('🧠', 'Chain-of-Thought', stats.cot     ?? 0, cotPct,      'var(--purple)')}
      </div>

      {/* Global platform stats */}
      <div style={{
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '2px',
          color: 'var(--text3)',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}>Global Platform Stats</div>

        {global === null ? (
          <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            Loading…
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            textAlign: 'center',
          }}>
            {[
              { val: global.queries,              lbl: 'Total queries' },
              { val: `${global.co2.toFixed(3)}kg`, lbl: 'Total CO₂ used' },
              { val: global.cot,                  lbl: 'CoT chosen' },
              { val: global.standard,             lbl: 'Standard chosen' },
            ].map(({ val, lbl }) => (
              <div key={lbl}>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 22,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 4,
                }}>{val}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{lbl}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Methodology */}
      <div style={{
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
        marginTop: 16,
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '2px',
          color: 'var(--text3)',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}>Carbon Estimation Methodology</div>

        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}>
          <p style={{ marginTop: 0 }}>
          Carbon emissions are estimated using the formula: Emissions = Power × Time × Carbon Intensity,
          based on the Nautilus CPU hardware and California regional grid data:
          </p>
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border2)',
            borderRadius: 8,
            padding: '12px 16px',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            marginBottom: 0,
            lineHeight: 2,
          }}>
            <div>Emissions = Power × Time × Carbon Intensity</div>
            <div>Energy (Wh) = <span style={{ color: 'var(--green)' }}>150W</span> × (duration_seconds / 3600)</div>
            <div>CO₂ (g) = (Energy / 1000) × <span style={{ color: 'var(--green)' }}>200 gCO₂/kWh</span></div>
            <div>CO₂ saved = |CO₂(model A) − CO₂(model B)|</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 2, marginTop: 16 }}>
            <div style={{ marginBottom: 4 }}>
            <span style={{ color: 'var(--text2)', fontWeight: 500 }}>📄 EPA eGRID 2023</span>
            {' '}— U.S. Regional Carbon Intensity — California grid: 200 gCO₂/kWh.{' '}
            <a href="https://www.epa.gov/egrid" target="_blank" rel="noreferrer"
              style={{ color: 'var(--green)' }}>epa.gov/egrid</a>
            </div>
            <div style={{ marginBottom: 4 }}>
            <span style={{ color: 'var(--text2)', fontWeight: 500 }}>📄 IEA (2023)</span>
            {' '}— "Data Centres and Data Transmission Networks."{' '}
            <a href="https://www.iea.org/reports/data-centres-and-data-transmission-networks" target="_blank" rel="noreferrer"
            style={{ color: 'var(--green)' }}>iea.org</a>
            </div>
            <div>
              <span style={{ color: 'var(--text2)', fontWeight: 500 }}>🌐 ML CO₂ Impact Calculator</span>
              {' '}— Lacoste et al.{' '}
              <a href="https://mlco2.github.io/impact" target="_blank" rel="noreferrer"
                style={{ color: 'var(--green)' }}>mlco2.github.io/impact</a>
            </div>
            <div>
               <span style={{ color: 'var(--text2)', fontWeight: 500 }}>📄 Patterson et al. (2021)</span>
                {' '}— "Carbon and the Cloud" — Google Research.{' '}
                <a href="https://arxiv.org/abs/2104.10350" target="_blank" rel="noreferrer"
                style={{ color: 'var(--green)' }}>arxiv.org/abs/2104.10350</a>
            </div>
            </div>

              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 0, marginTop: 12 }}>
                ⚠️ These are estimates. Actual emissions vary by hardware, data center location,
                and energy source. GPU inference on Nautilus cluster (CPU-only) may differ
                from published A100 benchmarks.
                </p>
              </div>
            </div>

          </div>
      )
    }     