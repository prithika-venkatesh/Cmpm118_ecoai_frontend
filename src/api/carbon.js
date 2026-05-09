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

const CO2_PER_TOKEN_G  = 0.0023   // grams of CO₂ per token
const WH_PER_TOKEN     = 0.0005   // watt-hours per token

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

  return {
    co2_g:       parseFloat((totalTokens * CO2_PER_TOKEN_G).toFixed(4)),
    wattHours:   parseFloat((totalTokens * WH_PER_TOKEN * 1000).toFixed(1)), // in mWh
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
