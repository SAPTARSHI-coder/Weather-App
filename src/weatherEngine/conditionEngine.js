/**
 * Condition Engine Module (v2)
 * Derives a weather condition label from real numeric data.
 * Now includes:
 *  - Fog / Hazy detection via humidity × visibility correlation
 *  - Harsh Sun detection via UV index
 *  - Upgraded temperature thresholds
 */

/**
 * Calculate the smart weather condition from fused snapshot.
 * Rules are evaluated in strict priority order.
 *
 * @param {Object} fused - Fused WeatherSnapshot (includes _raw_condition, uv)
 * @returns {{ condition: string, emoji: string }}
 */
export function deriveCondition(fused) {
    const { temp, humidity, visibility, cloud, wind_kph, uv, is_day } = fused;
    const rawCondition = (fused._raw_condition || '').toLowerCase();

    // ── Priority 1: Precipitation (trust API labels for rain/storm/snow) ──
    if (rawCondition.includes('thunder') || rawCondition.includes('storm')) {
        return { condition: 'Thunderstorm', emoji: '⛈️' };
    }
    if (rawCondition.includes('snow') || rawCondition.includes('blizzard') || rawCondition.includes('sleet')) {
        return { condition: 'Snow', emoji: '❄️' };
    }
    if (rawCondition.includes('rain') || rawCondition.includes('drizzle')) {
        return { condition: 'Rain', emoji: '🌧️' };
    }

    // ── Priority 2: Fog / Haze (humidity × visibility correlation) ──
    if (humidity != null && visibility != null) {
        if (humidity > 80 && visibility < 3) {
            return { condition: 'Fog', emoji: '🌫️' };
        }
        if (humidity > 65 && visibility < 6) {
            return { condition: 'Hazy', emoji: '🌁' };
        }
        if (humidity > 75 && visibility < 5) {
            return { condition: 'Mist', emoji: '🌫️' };
        }
    }

    // ── Priority 3: UV-driven ──
    if (uv != null && uv > 8 && is_day) {
        return { condition: 'Harsh Sun', emoji: '🔆' };
    }

    // ── Priority 4: Temperature extremes ──
    if (temp != null) {
        if (temp < 5) return { condition: 'Cold', emoji: '🥶' };
        if (temp > 34 && wind_kph != null && wind_kph < 8) {
            return { condition: 'Hot', emoji: '🌡️' };
        }
    }

    // ── Priority 5: Cloud cover ──
    if (cloud != null) {
        if (cloud > 75) return { condition: 'Overcast', emoji: '☁️' };
        if (cloud > 60) return { condition: 'Cloudy', emoji: '🌥️' };
        if (cloud > 25) return { condition: is_day ? 'Partly Cloudy' : 'Partly Cloudy Night', emoji: '⛅' };
    }

    // ── Default: Clear ──
    return { condition: is_day ? 'Clear' : 'Clear Night', emoji: is_day ? '☀️' : '🌙' };
}

/**
 * Map a condition string to a Remix icon class.
 */
export function conditionToIcon(condition) {
    const c = condition.toLowerCase();
    if (c.includes('thunder')) return 'ri-thunderstorms-fill';
    if (c.includes('snow') || c.includes('blizzard')) return 'ri-snowflake-fill';
    if (c.includes('rain') || c.includes('drizzle')) return 'ri-heavy-showers-fill';
    if (c.includes('fog') || c.includes('hazy')) return 'ri-foggy-fill';
    if (c.includes('mist')) return 'ri-mist-fill';
    if (c.includes('overcast')) return 'ri-cloudy-fill';
    if (c.includes('cloudy')) return 'ri-cloudy-2-fill';
    if (c.includes('cold')) return 'ri-temp-cold-fill';
    if (c.includes('hot') || c.includes('harsh')) return 'ri-temp-hot-fill';
    if (c.includes('night')) return 'ri-moon-clear-fill';
    return 'ri-sun-fill';
}
