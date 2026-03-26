/**
 * Stability Engine
 * Computes environmental stability from the temperature variance in the ring buffer.
 * Classifies conditions as Stable / Fluctuating / Volatile.
 */

/**
 * Compute population variance of an array of numbers.
 * @param {number[]} values
 * @returns {number}
 */
function variance(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

/**
 * Calculate the stability classification for a city's ring buffer.
 *
 * @param {Object[]} buffer - Array of snapshots from trendEngine.getBuffer()
 * @returns {{
 *   stability: 'Stable' | 'Fluctuating' | 'Volatile',
 *   temp_variance: number,
 *   pressure_variance: number,
 *   stability_score: number
 * }}
 */
export function calcStability(buffer) {
    if (buffer.length < 2) {
        return {
            stability: 'Stable',
            temp_variance: 0,
            pressure_variance: 0,
            stability_score: 0
        };
    }

    const temps     = buffer.map(e => e.temp      ?? 0);
    const pressures = buffer.map(e => e.pressure_mb ?? 1013);
    const humidities= buffer.map(e => e.humidity  ?? 50);

    const tempVar  = variance(temps);
    const pressVar = variance(pressures);
    const humVar   = variance(humidities);

    // Composite score (weighted sum)
    const score = (tempVar * 2) + (pressVar * 0.05) + (humVar * 0.3);

    let stability;
    if (score < 1.5)        stability = 'Stable';
    else if (score < 6)     stability = 'Fluctuating';
    else                    stability = 'Volatile';

    return {
        stability,
        temp_variance:     Math.round(tempVar * 100) / 100,
        pressure_variance: Math.round(pressVar * 100) / 100,
        stability_score:   Math.round(score * 100) / 100
    };
}
