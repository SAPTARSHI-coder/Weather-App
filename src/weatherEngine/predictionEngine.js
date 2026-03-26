/**
 * Prediction Engine
 * Uses current fused data + trend slopes to predict conditions 1 hour ahead.
 */

/**
 * Get a human-readable direction label for a trend value.
 * @param {number} slope
 * @returns {string}
 */
export function trendLabel(slope) {
    if (slope > 1.5)  return '↑↑ Rapidly Rising';
    if (slope > 0.3)  return '↑ Rising';
    if (slope < -1.5) return '↓↓ Rapidly Falling';
    if (slope < -0.3) return '↓ Falling';
    return '→ Stable';
}

/**
 * Predict environmental conditions one hour from now.
 *
 * @param {Object} fused  - Current fused weather object from fusionEngine
 * @param {Object} trends - Trend slopes from trendEngine.getTrends()
 * @returns {{
 *   predicted_temp: number,
 *   predicted_condition: string,
 *   temp_direction: string,
 *   prediction_confidence: string
 * }}
 */
export function predictNextHour(fused, trends) {
    const temp       = fused.temp        ?? 20;
    const humidity   = fused.humidity    ?? 50;
    const cloud      = fused.cloud       ?? 0;
    const visibility = fused.visibility  ?? 10;
    const pressure   = fused.pressure_mb ?? 1013;
    const aqi        = fused.aqi         ?? 0;

    const { temp_trend, humidity_trend, pressure_trend, buffer_size } = trends;

    // ── Predicted temperature  ──────────────────────────────────────────────
    // Temporal Variance Fix: Use weighted trend instead of flat smoothing
    const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
    const variance = temp_trend * randomFactor;
    
    // Clamp within ±3°C realistic bounds
    const clamped_variance = Math.max(-3, Math.min(3, variance));
    const raw_predicted = temp + clamped_variance;
    
    const predicted_temp = Math.round(raw_predicted * 10) / 10;

    // ── Predicted condition ─────────────────────────────────────────────────
    let predicted_condition = fused.condition ?? 'Clear';

    if (pressure_trend < -1.5 && humidity > 65) {
        predicted_condition = 'Possible Rain';
    } else if (humidity > 85 && visibility < 3) {
        predicted_condition = 'Fog Likely';
    } else if (temp_trend > 1.5 && humidity > 70) {
        predicted_condition = 'Hot & Humid';
    } else if (temp_trend < -1 && humidity_trend > 1) {
        predicted_condition = 'Cooling — Moisture Building';
    } else if (cloud > 75 && pressure_trend < -0.5) {
        predicted_condition = 'Overcast & Unsettled';
    } else if (aqi > 150 && temp_trend > 0.5) {
        predicted_condition = 'Warm & Polluted';
    } else if (temp_trend > 0.5) {
        predicted_condition = 'Warming Up';
    } else if (temp_trend < -0.5) {
        predicted_condition = 'Cooling Down';
    }

    // ── Prediction confidence ───────────────────────────────────────────────
    let prediction_confidence;
    if (buffer_size >= 5)      prediction_confidence = 'High';
    else if (buffer_size >= 3) prediction_confidence = 'Medium';
    else if (buffer_size >= 2) prediction_confidence = 'Low';
    else                       prediction_confidence = 'Calculating…';

    return {
        predicted_temp,
        predicted_condition,
        temp_direction: trendLabel(temp_trend),
        prediction_confidence
    };
}
