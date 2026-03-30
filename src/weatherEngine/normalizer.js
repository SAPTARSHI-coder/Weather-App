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

/**
 * Synthesize a fake WeatherAPI raw payload using Open-Meteo data
 * to prevent the frontend UI from crashing when WeatherAPI is completely down.
 */
export function synthesizeWeatherApiRaw(omData, q) {
    const cw = omData.current_weather || {};
    const tz = omData.timezone || "UTC";
    const tempC = cw.temperature || 0;
    
    let conditionText = "Clear";
    const code = cw.weathercode || 0;
    if (code >= 1 && code <= 3) conditionText = "Partly Cloudy";
    else if (code >= 45 && code <= 48) conditionText = "Foggy";
    else if (code >= 51 && code <= 67) conditionText = "Rainy";
    else if (code >= 71 && code <= 77) conditionText = "Snowy";
    else if (code >= 95) conditionText = "Thunderstorm";

    const forecastdays = [];
    if (omData.daily && omData.daily.time) {
        for (let i = 0; i < Math.min(3, omData.daily.time.length); i++) {
             const hours = [];
             if (omData.hourly && omData.hourly.time) {
                 for (let h = 0; h < 24; h++) {
                     let hourIdx = (i * 24) + h;
                     if (hourIdx < omData.hourly.time.length) {
                         hours.push({
                             time: omData.hourly.time[hourIdx],
                             temp_c: omData.hourly.temperature_2m?.[hourIdx] || tempC,
                             condition: { text: conditionText },
                             wind_kph: omData.hourly.windspeed_10m?.[hourIdx] || cw.windspeed || 0,
                             wind_degree: cw.winddirection || 0,
                             pressure_mb: 1013,
                             cloud: omData.hourly.cloudcover?.[hourIdx] || 0,
                             humidity: omData.hourly.relativehumidity_2m?.[hourIdx] || 50,
                             uv: 5
                         });
                     }
                 }
             }
             forecastdays.push({
                 date: omData.daily.time[i],
                 day: {
                     maxtemp_c: omData.daily.temperature_2m_max?.[i] || tempC,
                     mintemp_c: omData.daily.temperature_2m_min?.[i] || tempC,
                     maxtemp_f: ((omData.daily.temperature_2m_max?.[i] || tempC) * 9/5) + 32,
                     mintemp_f: ((omData.daily.temperature_2m_min?.[i] || tempC) * 9/5) + 32,
                     avgtemp_c: tempC,
                     maxwind_kph: omData.daily.windspeed_10m_max?.[i] || cw.windspeed || 0,
                     totalprecip_mm: omData.daily.precipitation_sum?.[i] || 0,
                     avghumidity: 50,
                     condition: { text: conditionText },
                     uv: 5
                 },
                 astro: {
                     sunrise: "06:00 AM",
                     sunset: "06:00 PM"
                 },
                 hour: hours
             });
        }
    }

    return {
        location: {
            name: q || "Unknown Location",
            lat: omData.latitude || 0,
            lon: omData.longitude || 0,
            tz_id: tz,
            localtime: cw.time || new Date().toISOString()
        },
        current: {
            temp_c: tempC,
            temp_f: (tempC * 9/5) + 32,
            is_day: cw.is_day ?? 1,
            condition: { text: conditionText },
            wind_kph: cw.windspeed || 0,
            wind_degree: cw.winddirection || 0,
            wind_dir: "N/A",
            pressure_mb: 1013,
            precip_mm: 0,
            humidity: 50,
            cloud: 50,
            feelslike_c: tempC,
            feelslike_f: (tempC * 9/5) + 32,
            vis_km: 10,
            uv: 5,
            air_quality: {
                co: 300,
                "us-epa-index": 1
            }
        },
        forecast: {
            forecastday: forecastdays
        }
    };
}
