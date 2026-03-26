/**
 * Confidence Calculator Module (v2)
 * Computes a reliability score AND a human-readable reason.
 */

/**
 * Calculate confidence level from temperature divergence and source count.
 * @param {number} tempDiff    - |WeatherAPI.temp - OpenMeteo.temp|
 * @param {number} sourcesUsed - How many sources were successfully merged
 * @returns {{ level, label, color, icon, reason }}
 */
export function calculateConfidence(tempDiff, sourcesUsed) {
    // Single source — inherently uncertain
    if (sourcesUsed < 2) {
        return {
            level: 'Low',
            label: 'Single Source',
            color: '#ef4444',
            icon: '🔴',
            reason: 'Only one source available — secondary source unavailable'
        };
    }

    if (tempDiff < 2) {
        return {
            level: 'High',
            label: 'High Confidence',
            color: '#22c55e',
            icon: '🟢',
            reason: `Sources aligned (±${tempDiff.toFixed(1)}°C variance)`
        };
    }

    if (tempDiff <= 5) {
        return {
            level: 'Medium',
            label: 'Medium Confidence',
            color: '#f59e0b',
            icon: '🟡',
            reason: `Moderate variance between sources (±${tempDiff.toFixed(1)}°C)`
        };
    }

    return {
        level: 'Low',
        label: 'Low Confidence',
        color: '#ef4444',
        icon: '🔴',
        reason: `High variance detected between sources (±${tempDiff.toFixed(1)}°C)`
    };
}
