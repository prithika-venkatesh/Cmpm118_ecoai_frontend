// ─────────────────────────────────────────────────────────
//  carbon.js  –  Estimate CO₂ and energy from token counts
// ─────────────────────────────────────────────────────────
//
//  These numbers are based on published ML energy research:
//    - Patterson et al. (2021) "Carbon and the Cloud"
//    - ~0.0023g CO₂ per token on a modern GPU data center
//    - ~0.0005 Wh  per token (A100-class GPU)
//
//  When your backend is ready, replace this whole file with
//  a single fetch() call to your real carbon API endpoint.
//
// ─────────────────────────────────────────────────────────

const CPU_TDP_WATTS         = 150    // server CPU thermal design power (watts)
const CARBON_INTENSITY      = 200    // gCO₂ per kWh, California grid (EPA eGRID 2023)

/**
 * Given usage data returned by the Groq API, return
 * human-readable carbon and energy estimates.
 *
 * @param {number} promptTokens      – input token count
 * @param {number} completionTokens  – output token count
 * @param {number} durationMs        – how long the call took (ms)
 * @returns {{ co2_g, wattHours, totalTokens, speed, duration, inTokens, outTokens }}
 */
export function estimateUsage(promptTokens, completionTokens, durationMs) {
  const totalTokens = promptTokens + completionTokens
  const durationSec = durationMs / 1000
  const durationHrs = durationSec / 3600
  const wattHours   = CPU_TDP_WATTS * durationHrs
  const co2_g       = parseFloat(((wattHours / 1000) * CARBON_INTENSITY).toFixed(4))


  return {
    co2_g,
    wattHours:    parseFloat((wattHours * 1000).toFixed(1)),
    totalTokens,
    speed:       Math.round(completionTokens / durationSec),  // tok/s
    duration:    parseFloat(durationSec.toFixed(1)),
    inTokens:    promptTokens,
    outTokens:   completionTokens,
  }
}

/**
 * Calculate how much CO₂ the user "saved" by picking the
 * more efficient model over the heavier one.
 *
 * Returns 0 if the chosen model was actually heavier.
 */
export function calcCO2Saved(standardCO2, cotCO2, chosen) {
  const diff = chosen === 'standard'
    ? cotCO2 - standardCO2
    : standardCO2 - cotCO2
  return Math.max(0, parseFloat(diff.toFixed(4)))
}
