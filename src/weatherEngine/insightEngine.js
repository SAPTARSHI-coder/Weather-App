/**
 * Insight Engine
 * Generates up to 4 contextual, human-readable insight strings based on
 * current readings, trends, anomalies, and derived states.
 * Insights are ordered by priority (highest impact first).
 */

/**
 * Generate an ordered list of environmental insights.
 *
 * @param {Object} fused        - Current fused weather snapshot
 * @param {Object} trends       - From trendEngine.getTrends()
 * @param {string[]} anomalies  - From anomalyEngine.detectAnomalies()
 * @param {string} rain_prob    - 'Low' | 'Medium' | 'High'
 * @returns {string[]} Up to 4 insight strings, ordered by priority
 */
export function generateInsights(fused, trends, anomalies, rain_prob) {
    const candidates = []; // { priority: number, text: string }

    const temp       = fused.temp        ?? 20;
    const humidity   = fused.humidity    ?? 50;
    const visibility = fused.visibility  ?? 10;
    const aqi        = fused.aqi         ?? 0;
    const cloud      = fused.cloud       ?? 0;
    const uv         = fused.uv          ?? 0;
    const pressure   = fused.pressure_mb ?? 1013;

    const {
        temp_trend, humidity_trend, pressure_trend,
        aqi_trend, visibility_trend, buffer_size
    } = trends;

    // ── First-load note (only 1 reading yet) ───────────────────────────────
    if (buffer_size < 2) {
        candidates.push({ priority: 0, text: '📡 Trend analysis available after monitoring starts' });
    }

    // ── User Explicit Smart Insights ───────────────────────────────────────
    if (aqi > 150)        candidates.push({ priority: 20, text: 'Unhealthy air quality' });
    if (visibility < 3)   candidates.push({ priority: 19, text: 'Low visibility conditions' });
    if (humidity > 80)    candidates.push({ priority: 18, text: 'High humidity detected' });

    // ── Temperature insights ───────────────────────────────────────────────
    if (temp_trend > 2)   candidates.push({ priority: 9,  text: `🌡️ Temperature increasing rapidly (+${temp_trend.toFixed(1)}°C/hr)` });
    if (temp_trend < -2)  candidates.push({ priority: 9,  text: `❄️ Temperature dropping fast (${temp_trend.toFixed(1)}°C/hr)` });
    if (temp > 38)        candidates.push({ priority: 8,  text: '🔥 Extreme heat — stay hydrated, avoid outdoor exertion' });
    if (temp < 2)         candidates.push({ priority: 8,  text: '🧊 Near-freezing — risk of ice or frost' });
    if (temp >= 28 && humidity >= 70) {
        candidates.push({ priority: 7, text: '🥵 High heat index — feels hotter than temperature suggests' });
    }

    // ── Air quality insights ───────────────────────────────────────────────
    if (aqi_trend > 20)   candidates.push({ priority: 10, text: '🏭 Air quality worsening rapidly — limit outdoor exposure' });
    if (aqi > 200)        candidates.push({ priority: 9,  text: '😷 Very unhealthy air quality — wear a mask outdoors' });
    else if (aqi > 150)   candidates.push({ priority: 8,  text: '😷 Unhealthy air quality — sensitive groups stay indoors' });
    else if (aqi > 100)   candidates.push({ priority: 5,  text: '⚠️ Moderate pollution — sensitive groups exercise caution' });
    else if (aqi < 50 && aqi > 0) {
        candidates.push({ priority: 3, text: '✅ Air quality is excellent — great day for outdoors' });
    }

    // ── Pressure & storm insights ──────────────────────────────────────────
    if (pressure_trend < -2) candidates.push({ priority: 10, text: '⛈️ Rapid pressure drop — severe weather approaching' });
    if (pressure_trend < -1) candidates.push({ priority: 7,  text: '💨 Pressure falling — conditions becoming unstable' });
    if (pressure > 1025)     candidates.push({ priority: 2,  text: '🌤️ High pressure — clear and settled conditions likely' });

    // ── Humidity & fog insights ────────────────────────────────────────────
    if (humidity > 85 && visibility < 3) {
        candidates.push({ priority: 9, text: '🌫️ Fog conditions developing — drive carefully' });
    } else if (humidity > 85) {
        candidates.push({ priority: 5, text: '💧 Very high humidity — discomfort and possible mist' });
    }
    if (humidity_trend > 5) candidates.push({ priority: 6, text: '💧 Humidity surging — moisture levels rising quickly' });

    // ── Visibility insights ────────────────────────────────────────────────
    if (visibility < 1)      candidates.push({ priority: 9, text: '🌫️ Near-zero visibility — dense fog or heavy smoke' });
    else if (visibility < 4) candidates.push({ priority: 7, text: '🌫️ Poor visibility — exercise caution when driving' });
    if (visibility_trend < -2 && buffer_size > 1) {
        candidates.push({ priority: 7, text: '🌫️ Visibility deteriorating — fog or precipitation building' });
    }

    // ── UV insights ────────────────────────────────────────────────────────
    if (uv >= 11)      candidates.push({ priority: 8, text: '☀️ Extreme UV — full sun protection essential' });
    else if (uv >= 8)  candidates.push({ priority: 6, text: '☀️ Very high UV — sunscreen and shade recommended' });
    else if (uv >= 6)  candidates.push({ priority: 4, text: '☀️ High UV — limit midday sun exposure' });

    // ── Rain insights ──────────────────────────────────────────────────────
    if (rain_prob === 'High')   candidates.push({ priority: 8, text: '🌧️ High chance of rain — carry an umbrella' });
    else if (rain_prob === 'Medium') candidates.push({ priority: 5, text: '🌦️ Moderate rain chance — be prepared' });

    // ── Cloud / overcast insights ──────────────────────────────────────────
    if (cloud >= 90)  candidates.push({ priority: 3, text: '☁️ Completely overcast — no direct sunlight' });

    // ── Positive conditions ────────────────────────────────────────────────
    if (temp >= 18 && temp <= 26 && humidity < 60 && aqi < 60 && cloud < 40) {
        candidates.push({ priority: 4, text: '🌟 Near-perfect weather conditions right now' });
    }

    // ── Sort by priority descending, take top 4 ───────────────────────────
    candidates.sort((a, b) => b.priority - a.priority);
    let finalTexts = candidates.map(c => c.text);
    finalTexts = [...new Set(finalTexts)].slice(0, 4);

    // ── Fallback ──────────────────────────────────────────────────────────
    if (finalTexts.length === 0) {
        finalTexts.push("Stable conditions expected");
    }

    return finalTexts;
}
