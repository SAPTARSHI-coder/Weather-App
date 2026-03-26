/**
 * AQI Handler Module
 * Normalizes AQI values to the Indian CPCB standard.
 */

/**
 * CPCB AQI breakpoints
 */
const CPCB_BREAKPOINTS = [
    { max: 50,  label: 'Good',       color: '#4CAF50', emoji: '🟢' },
    { max: 100, label: 'Satisfactory', color: '#8BC34A', emoji: '🟡' },
    { max: 200, label: 'Moderate',   color: '#FFC107', emoji: '🟠' },
    { max: 300, label: 'Poor',       color: '#FF5722', emoji: '🔴' },
    { max: 400, label: 'Very Poor',  color: '#9C27B0', emoji: '🔴' },
    { max: Infinity, label: 'Severe', color: '#B71C1C', emoji: '⚫' }
];

/**
 * Map a US EPA index (1-6) to a CPCB-like AQI number.
 * EPA index 1 = Good, 6 = Hazardous
 */
function epaIndexToCpcb(epaIndex) {
    const map = { 1: 25, 2: 75, 3: 150, 4: 250, 5: 350, 6: 450 };
    return map[epaIndex] ?? 50;
}

/**
 * Get the CPCB category for a numeric AQI value.
 * @param {number} aqiValue
 * @returns {{ label: string, color: string, emoji: string }}
 */
export function categorizeAQI(aqiValue) {
    for (const bp of CPCB_BREAKPOINTS) {
        if (aqiValue <= bp.max) {
            return { label: bp.label, color: bp.color, emoji: bp.emoji };
        }
    }
    return { label: 'Severe', color: '#B71C1C', emoji: '⚫' };
}

/**
 * Health tip based on AQI
 */
export function getAQIHealthTip(aqiValue) {
    if (aqiValue <= 50)  return 'Air is clean. Perfect for outdoor activities! 🌿';
    if (aqiValue <= 100) return 'Acceptable air quality. Enjoy your day.';
    if (aqiValue <= 200) return 'Moderate air. Sensitive groups should limit outdoor exertion.';
    if (aqiValue <= 300) return 'Poor air quality. Wear a mask outdoors.';
    if (aqiValue <= 400) return 'Very poor air. Avoid outdoor activities. 😷';
    return 'Hazardous air! Stay indoors and use air purifiers. 🚨';
}

/**
 * Primary AQI resolution: WeatherAPI → converts EPA index to CPCB
 * @param {Object} airQuality - WeatherAPI air_quality object
 * @returns {number} CPCB AQI value
 */
export function resolveAQI(airQuality) {
    if (!airQuality) return null;
    const epaIndex = airQuality['us-epa-index'];
    if (epaIndex) return epaIndexToCpcb(epaIndex);
    return null;
}
