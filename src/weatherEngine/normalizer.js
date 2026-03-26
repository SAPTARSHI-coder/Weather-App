/**
 * Normalizer Module
 * Converts raw API responses from WeatherAPI and Open-Meteo into
 * a unified WeatherSnapshot schema.
 */

/**
 * Normalize a WeatherAPI forecast.json response
 * @param {Object} data - Raw WeatherAPI response
 * @returns {Object} Normalized WeatherSnapshot
 */
export function normalizeWeatherAPI(data) {
    const current = data.current;
    const location = data.location;

    // Extract AQI from us-epa-index → rough µg/m³ mapping
    let aqiRaw = 0;
    if (current.air_quality) {
        const epaIndex = current.air_quality['us-epa-index'];
        const epaMap = { 1: 25, 2: 75, 3: 150, 4: 250, 5: 350, 6: 450 };
        aqiRaw = epaMap[epaIndex] || 50;
    }

    return {
        source: 'WeatherAPI',
        temp: current.temp_c,
        feels_like: current.feelslike_c,
        humidity: current.humidity,
        wind_kph: current.wind_kph,
        wind_dir: current.wind_dir,
        wind_degree: current.wind_degree,
        cloud: current.cloud,
        visibility: current.vis_km,
        uv: current.uv,
        is_day: current.is_day,
        condition_text: current.condition.text,
        aqi: aqiRaw,
        precip_mm: current.precip_mm,
        pressure_mb: current.pressure_mb,
        timestamp: new Date(location.localtime).toISOString(),
        lat: location.lat,
        lon: location.lon,
        city: location.name,
        country: location.country,
        // Pass the original response so the frontend can still use existing UI
        raw: data
    };
}

/**
 * Normalize an Open-Meteo current weather response
 * @param {Object} data - Raw Open-Meteo current_weather or hourly response
 * @returns {Object} Normalized WeatherSnapshot
 */
export function normalizeOpenMeteo(data) {
    const cw = data.current_weather || {};
    const hourly = data.hourly || {};

    // Open-Meteo current_weather has limited fields; supplement with hourly[0] if available
    const idx = 0; // Use first hour as "current"
    const temp = cw.temperature ?? (hourly.temperature_2m?.[idx] ?? null);
    const windKph = cw.windspeed != null
        ? cw.windspeed  // Open-Meteo returns km/h for windspeed_unit=kmh
        : (hourly.windspeed_10m?.[idx] ?? null);

    const humidity = hourly.relativehumidity_2m?.[idx] ?? null;
    const cloud = hourly.cloudcover?.[idx] ?? null;
    const visibility = hourly.visibility?.[idx] != null
        ? hourly.visibility[idx] / 1000  // meters → km
        : null;

    return {
        source: 'Open-Meteo',
        temp,
        feels_like: null,   // Not provided in current_weather block
        humidity,
        wind_kph: windKph,
        wind_dir: null,
        cloud,
        visibility,
        uv: null,
        is_day: cw.is_day ?? null,
        condition_text: null,   // Replaced by conditionEngine
        aqi: null,              // Open-Meteo doesn't provide AQI
        timestamp: cw.time ? new Date(cw.time).toISOString() : new Date().toISOString()
    };
}
