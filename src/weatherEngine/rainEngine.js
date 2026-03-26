/**
 * Rain Probability Engine
 * Uses humidity, pressure_trend, cloud cover, and visibility to score rain probability.
 */

/**
 * Calculate rain probability category and score.
 *
 * @param {number} humidity        - Relative humidity %
 * @param {number} pressure_trend  - hPa per hour slope
 * @param {number} cloud           - Cloud cover %
 * @param {number} visibility      - km
 * @param {number} precip_mm       - Current precipitation mm
 * @returns {{ rain_probability: string, rain_score: number, rain_factors: string[] }}
 */
export function calcRainProbability(humidity, pressure_trend, cloud, visibility, precip_mm = 0) {
    let score = 0;
    const factors = [];

    // ── Humidity scoring ────────────────────────────────────────────────────
    if (humidity >= 90) {
        score += 4;
        factors.push('Very high humidity (≥90%)');
    } else if (humidity >= 80) {
        score += 3;
        factors.push('High humidity (≥80%)');
    } else if (humidity >= 70) {
        score += 2;
        factors.push('Elevated humidity (≥70%)');
    } else if (humidity >= 55) {
        score += 1;
        factors.push('Moderate humidity');
    }

    // ── Pressure trend scoring ──────────────────────────────────────────────
    if (pressure_trend < -2) {
        score += 4;
        factors.push('Sharp pressure drop (storm risk)');
    } else if (pressure_trend < -1) {
        score += 3;
        factors.push('Pressure dropping quickly');
    } else if (pressure_trend < -0.3) {
        score += 2;
        factors.push('Pressure falling');
    }

    // ── Cloud cover scoring ─────────────────────────────────────────────────
    if (cloud >= 85) {
        score += 3;
        factors.push('Heavy cloud cover (≥85%)');
    } else if (cloud >= 70) {
        score += 2;
        factors.push('Significant cloud cover');
    } else if (cloud >= 50) {
        score += 1;
        factors.push('Partly cloudy');
    }

    // ── Visibility scoring ──────────────────────────────────────────────────
    if (visibility < 2) {
        score += 2;
        factors.push('Very low visibility');
    } else if (visibility < 5) {
        score += 1;
        factors.push('Reduced visibility');
    }

    // ── Active precipitation bonus ──────────────────────────────────────────
    if (precip_mm > 0.5) {
        score += 3;
        factors.push('Active precipitation detected');
    }

    // ── Category mapping ────────────────────────────────────────────────────
    let rain_probability;
    if (score >= 7)      rain_probability = 'High';
    else if (score >= 4) rain_probability = 'Medium';
    else                 rain_probability = 'Low';

    return { rain_probability, rain_score: score, rain_factors: factors };
}
