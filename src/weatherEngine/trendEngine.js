/**
 * Trend Engine
 * Maintains a per-city rolling ring buffer (last 6 readings) and computes
 * linear regression slopes for temperature, humidity, pressure, AQI, and visibility.
 *
 * Slope unit = change-per-hour (e.g. +1.5 means +1.5°C estimated per hour).
 */

const MAX_BUFFER = 6;
const cityBuffers = new Map(); // cityKey → [{ts, temp, humidity, pressure_mb, aqi, visibility}]

/**
 * Record a new snapshot for a city.
 * @param {string} cityKey - Normalised city identifier (lowercase, underscores)
 * @param {Object} snap    - { temp, humidity, pressure_mb, aqi, visibility }
 */
export function recordSnapshot(cityKey, snap) {
    if (!cityBuffers.has(cityKey)) cityBuffers.set(cityKey, []);
    const buf = cityBuffers.get(cityKey);

    buf.push({ ts: Date.now(), ...snap });

    // Keep only the last MAX_BUFFER entries
    if (buf.length > MAX_BUFFER) buf.splice(0, buf.length - MAX_BUFFER);
}

/**
 * Linear regression slope over an array of numbers.
 * Returns the slope (dy/dx where x is index) converted to per-hour rate.
 * Returns 0 if fewer than 2 data points.
 *
 * @param {number[]} values
 * @param {number[]} timestamps - Epoch ms timestamps aligned with values
 * @returns {number} slope per hour, rounded to 2dp
 */
function calcSlope(values, timestamps) {
    const n = values.length;
    if (n < 2) return 0;

    // Normalize x to hours from first timestamp
    const xs = timestamps.map(t => (t - timestamps[0]) / 3_600_000);
    const ys = values;

    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
        num += (xs[i] - xMean) * (ys[i] - yMean);
        den += (xs[i] - xMean) ** 2;
    }

    if (den === 0) return 0;
    return Math.round((num / den) * 100) / 100;
}

/**
 * Get trend slopes for a city over its buffered readings.
 * @param {string} cityKey
 * @returns {{ temp_trend, humidity_trend, pressure_trend, aqi_trend, visibility_trend, buffer_size }}
 */
export function getTrends(cityKey) {
    const buf = cityBuffers.get(cityKey) || [];

    if (buf.length < 2) {
        return {
            temp_trend:       0,
            humidity_trend:   0,
            pressure_trend:   0,
            aqi_trend:        0,
            visibility_trend: 0,
            buffer_size:      buf.length
        };
    }

    const ts   = buf.map(e => e.ts);
    const get  = field => buf.map(e => e[field] ?? null).filter(v => v !== null);

    return {
        temp_trend:       calcSlope(buf.map(e => e.temp ?? 0),        ts),
        humidity_trend:   calcSlope(buf.map(e => e.humidity ?? 0),    ts),
        pressure_trend:   calcSlope(buf.map(e => e.pressure_mb ?? 0), ts),
        aqi_trend:        calcSlope(buf.map(e => e.aqi ?? 0),         ts),
        visibility_trend: calcSlope(buf.map(e => e.visibility ?? 0),  ts),
        buffer_size:      buf.length
    };
}

/**
 * Get the raw buffer for a city (used by stabilityEngine).
 * @param {string} cityKey
 * @returns {Object[]}
 */
export function getBuffer(cityKey) {
    return cityBuffers.get(cityKey) || [];
}
