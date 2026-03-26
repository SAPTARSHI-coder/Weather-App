/**
 * Fusion Engine Module
 * Combines two normalized WeatherSnapshots into a single fused value
 * using weighted averaging and outlier removal.
 */

const WEIGHTS = {
    temp:     { primary: 0.6, secondary: 0.4 },
    wind_kph: { primary: 0.7, secondary: 0.3 },
    cloud:    { primary: 0.5, secondary: 0.5 },
    humidity: { primary: 1.0, secondary: 0.0 }, // WeatherAPI is authority
};

const TEMP_OUTLIER_THRESHOLD = 5; // °C

/**
 * Weighted average of two values, skipping nulls.
 */
function weightedAvg(a, b, wa, wb) {
    if (a == null && b == null) return null;
    if (a == null) return b;
    if (b == null) return a;
    return (a * wa + b * wb) / (wa + wb);
}

/**
 * Perform outlier removal on temperature.
 * If |primary - secondary| > threshold, discard the outlier.
 * Returns { primary, secondary } after sanitization.
 */
function removeOutlier(primary, secondary, threshold) {
    if (primary == null || secondary == null) {
        return { primary, secondary };
    }
    const diff = Math.abs(primary - secondary);
    if (diff > threshold) {
        // Discard the one further from a "reasonable" center
        // Simple heuristic: return only primary (trusted source)
        return { primary, secondary: null };
    }
    return { primary, secondary };
}

/**
 * Fuse two normalized snapshots.
 * @param {Object} primary   - Normalized WeatherAPI snapshot
 * @param {Object} secondary - Normalized Open-Meteo snapshot
 * @returns {Object} Fused snapshot
 */
export function fuseSnapshots(primary, secondary) {
    // Outlier removal on temperature
    const { primary: safeTemp1, secondary: safeTemp2 } = removeOutlier(
        primary.temp,
        secondary.temp,
        TEMP_OUTLIER_THRESHOLD
    );

    const fused = {
        temp: weightedAvg(safeTemp1, safeTemp2, WEIGHTS.temp.primary, WEIGHTS.temp.secondary),
        feels_like: primary.feels_like,  // Only WeatherAPI provides this
        humidity: weightedAvg(primary.humidity, secondary.humidity, WEIGHTS.humidity.primary, WEIGHTS.humidity.secondary),
        wind_kph: weightedAvg(primary.wind_kph, secondary.wind_kph, WEIGHTS.wind_kph.primary, WEIGHTS.wind_kph.secondary),
        wind_dir: primary.wind_dir,
        wind_degree: primary.wind_degree,
        cloud: weightedAvg(primary.cloud, secondary.cloud, WEIGHTS.cloud.primary, WEIGHTS.cloud.secondary),
        visibility: primary.visibility,  // WeatherAPI is more granular
        uv: primary.uv,
        is_day: primary.is_day,
        aqi: primary.aqi,
        precip_mm: primary.precip_mm,
        pressure_mb: primary.pressure_mb,
        timestamp: primary.timestamp,
        lat: primary.lat,
        lon: primary.lon,
        city: primary.city,
        country: primary.country,
        sources_used: [primary.source],
        temp_diff: (primary.temp != null && secondary.temp != null)
            ? Math.abs(primary.temp - secondary.temp)
            : 0
    };

    // Track that secondary was actually usable
    if (secondary.temp != null && safeTemp2 != null) {
        fused.sources_used.push(secondary.source);
    }

    // Round to 1 decimal for cleanliness
    ['temp', 'feels_like', 'humidity', 'wind_kph', 'cloud'].forEach(key => {
        if (fused[key] != null) fused[key] = Math.round(fused[key] * 10) / 10;
    });

    return fused;
}
