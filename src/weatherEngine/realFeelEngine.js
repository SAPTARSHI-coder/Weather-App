/**
 * RealFeel Engine
 * Calculates a human-perceived temperature model based on
 * temperature, humidity, wind speed, and UV index.
 * Modelled after AccuWeather's RealFeel® approach.
 */

// Smoothing state (per-city in-memory cache)
const smoothingCache = new Map();

/**
 * Enhanced RealFeel formula.
 * feels_like = temp + (humidity * 0.1) - (wind * 0.2) + (uv * 0.3)
 * Clamped to realistic ranges.
 *
 * @param {number} temp       - Temperature in °C
 * @param {number} humidity   - Relative humidity (%)
 * @param {number} wind_kph   - Wind speed in km/h
 * @param {number|null} uv    - UV Index (0–16)
 * @returns {number} Perceived temperature rounded to 1dp
 */
export function calcRealFeel(temp, humidity, wind_kph, uv = 0) {
    if (temp == null) return null;

    const h = humidity ?? 50;
    const w = wind_kph ?? 0;
    const u = uv ?? 0;

    let feels = temp
        + (h * 0.10)
        - (w * 0.20)
        + (u * 0.30);

    // Cap extremes: never more than ±15°C from actual temp
    const MAX_DELTA = 15;
    feels = Math.max(temp - MAX_DELTA, Math.min(temp + MAX_DELTA, feels));

    return Math.round(feels * 10) / 10;
}

/**
 * Apply exponential smoothing to a temperature to avoid jarring jumps.
 * smoothed = (prev * 0.7) + (current * 0.3) — only if |diff| > 2°C.
 *
 * @param {string} cityKey     - Cache key (e.g., city name normalised)
 * @param {number} currentTemp - Current fused temperature
 * @returns {number} Smoothed temperature
 */
export function applySmoothing(cityKey, currentTemp) {
    const prev = smoothingCache.get(cityKey);

    if (prev == null) {
        smoothingCache.set(cityKey, currentTemp);
        return currentTemp;
    }

    const diff = Math.abs(currentTemp - prev);
    if (diff > 2) {
        const smoothed = Math.round(((prev * 0.7) + (currentTemp * 0.3)) * 10) / 10;
        smoothingCache.set(cityKey, smoothed);
        return smoothed;
    }

    // Small change — keep current but update cache
    smoothingCache.set(cityKey, currentTemp);
    return currentTemp;
}

/**
 * Get a RealFeel descriptor for display.
 * @param {number} feels_like
 * @returns {string}
 */
export function realFeelDescriptor(feels_like) {
    if (feels_like == null) return '';
    if (feels_like >= 45) return 'Dangerously Hot';
    if (feels_like >= 38) return 'Very Hot';
    if (feels_like >= 30) return 'Hot';
    if (feels_like >= 22) return 'Warm';
    if (feels_like >= 14) return 'Comfortable';
    if (feels_like >= 7)  return 'Cool';
    if (feels_like >= 0)  return 'Cold';
    return 'Very Cold';
}
