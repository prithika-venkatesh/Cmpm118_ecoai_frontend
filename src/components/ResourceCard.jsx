// ─────────────────────────────────────────────────────────
//  ResourceCard.jsx  –  Shows CO₂, energy, token stats
//  Appears below each model response in the Compare view
// ─────────────────────────────────────────────────────────

import React from 'react'

const s = {
  card: {
    background: '#132916',
    border: '1px solid #1e3d22',
    borderRadius: 10,
    padding: '12px 14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    letterSpacing: '1.5px',
    color: 'var(--text3)',
    textTransform: 'uppercase',
  },
  efficientBadge: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--green)',
    border: '1px solid var(--green-dim)',
    background: 'rgba(34,197,94,0.08)',
    padding: '2px 7px',
    borderRadius: 4,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 10,
  },
  metricValue: {
    fontFamily: 'var(--mono)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'baseline',
    gap: 2,
  },
  unit: {
    fontSize: 9,
    fontWeight: 400,
    color: 'var(--text3)',
  },
  metricLabel: {
    fontSize: 9,
    color: 'var(--text3)',
    marginTop: 1,
    fontFamily: 'var(--mono)',
  },
  barTrack: {
    height: 2,
    background: '#1e3d22',
    borderRadius: 2,
    margin: '8px 0 4px',
  },
  barRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}

export default function ResourceCard({ data, isEfficient }) {
  // The bar shows CO₂ relative to max possible (we use 200g as ceiling)
  const pct = Math.min(100, (data.co2_g / 200) * 100)

  return (
    <div style={s.card}>
      {/* Header row */}
      <div style={s.header}>
        <span style={s.label}>Resource Usage</span>
        {isEfficient && <span style={s.efficientBadge}>✓ Efficient</span>}
      </div>

      {/* Row 1: CO₂ · Watt-hours · Tokens */}
      <div style={s.grid}>
        <div>
          <div style={s.metricValue}>
            <span style={{ color: 'var(--green)' }}>{data.co2_g}</span>
            <span style={s.unit}> g</span>
          </div>
          <div style={s.metricLabel}>CO₂</div>
        </div>
        <div>
          <div style={s.metricValue}>
            <span style={{ color: 'var(--amber)' }}>{data.wattHours}</span>
            <span style={s.unit}> mWh</span>
          </div>
          <div style={s.metricLabel}>Watt hours</div>
        </div>
        <div>
          <div style={s.metricValue}>{data.totalTokens}</div>
          <div style={s.metricLabel}>Tokens</div>
        </div>
      </div>

      {/* Row 2: Speed · Duration · In/Out */}
      <div style={s.grid}>
        <div>
          <div style={s.metricValue}>
            {data.speed}<span style={s.unit}> tok/s</span>
          </div>
          <div style={s.metricLabel}>Speed</div>
        </div>
        <div>
          <div style={s.metricValue}>
            {data.duration}<span style={s.unit}>s</span>
          </div>
          <div style={s.metricLabel}>Duration</div>
        </div>
        <div>
          <div style={s.metricValue}>
            {data.inTokens}
            <span style={s.unit}> / {data.outTokens}</span>
          </div>
          <div style={s.metricLabel}>In / Out</div>
        </div>
      </div>

      {/* CO₂ intensity bar */}
      <div style={s.barTrack}>
        <div style={{
          height: '100%',
          borderRadius: 2,
          width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--green-dim), var(--red))',
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={s.barRow}>
        <span style={s.metricLabel}>CO₂ intensity</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)' }}>
          {data.co2_g}g
        </span>
      </div>
    </div>
  )
}
