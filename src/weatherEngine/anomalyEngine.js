/**
 * Anomaly Detection Engine
 * Flags unusual environmental changes based on rate-of-change thresholds.
 * Only runs meaningful analysis when buffer_size >= 2.
 */

/**
 * Detect environmental anomalies from trend data and current readings.
 *
 * @param {Object} trends - From trendEngine.getTrends()
 * @param {Object} fused  - Current fused weather snapshot
 * @returns {{ anomalies: string[], severity: 'none'|'warning'|'critical' }}
 */
export function detectAnomalies(trends, fused) {
    const anomalies = [];
    const { temp_trend, pressure_trend, aqi_trend, humidity_trend, visibility_trend, buffer_size } = trends;

    // Need at least 2 readings to detect meaningful anomalies
    if (buffer_size < 2) {
        return { anomalies: [], severity: 'none' };
    }

    // ── Temperature anomalies ───────────────────────────────────────────────
    if (temp_trend > 4) {
        anomalies.push('🌡️ Extreme temperature surge detected');
    } else if (temp_trend > 2.5) {
        anomalies.push('🌡️ Temperature rising rapidly');
    } else if (temp_trend < -4) {
        anomalies.push('❄️ Severe temperature plunge');
    } else if (temp_trend < -2.5) {
        anomalies.push('❄️ Temperature dropping sharply');
    }

    // ── Pressure anomalies ──────────────────────────────────────────────────
    if (pressure_trend < -3) {
        anomalies.push('⛈️ Extreme pressure drop — storm imminent');
    } else if (pressure_trend < -1.5) {
        anomalies.push('💨 Sharp pressure drop — storm risk rising');
    }

    // ── AQI anomalies ───────────────────────────────────────────────────────
    if (aqi_trend > 50) {
        anomalies.push('🏭 Sudden severe pollution spike');
    } else if (aqi_trend > 20) {
        anomalies.push('🏭 Air quality deteriorating rapidly');
    }

    // ── Visibility anomalies ────────────────────────────────────────────────
    if ((fused.visibility ?? 10) < 1) {
        anomalies.push('🌫️ Near-zero visibility — dense fog');
    } else if (visibility_trend < -3 && (fused.visibility ?? 10) < 4) {
        anomalies.push('🌫️ Visibility falling fast — fog developing');
    }

    // ── Humidity surge ──────────────────────────────────────────────────────
    if (humidity_trend > 8) {
        anomalies.push('💧 Rapid humidity surge');
    }

    // ── Severity mapping ────────────────────────────────────────────────────
    let severity = 'none';
    if (anomalies.length >= 3 ||
        temp_trend > 4 || temp_trend < -4 ||
        pressure_trend < -3) {
        severity = 'critical';
    } else if (anomalies.length >= 1) {
        severity = 'warning';
    }

    return { anomalies, severity };
}
