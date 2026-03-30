import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import rateLimit from 'express-rate-limit';

import { normalizeWeatherAPI, normalizeOpenMeteo, synthesizeWeatherApiRaw } from './src/weatherEngine/normalizer.js';
import { fuseSnapshots } from './src/weatherEngine/fusionEngine.js';
import { deriveCondition, conditionToIcon } from './src/weatherEngine/conditionEngine.js';
import { resolveAQI, categorizeAQI, getAQIHealthTip } from './src/weatherEngine/aqiHandler.js';
import { calculateConfidence } from './src/weatherEngine/confidenceCalc.js';
import { calcRealFeel, applySmoothing, realFeelDescriptor } from './src/weatherEngine/realFeelEngine.js';
import { recordSnapshot, getTrends, getBuffer } from './src/weatherEngine/trendEngine.js';
import { predictNextHour, trendLabel } from './src/weatherEngine/predictionEngine.js';
import { calcRainProbability } from './src/weatherEngine/rainEngine.js';
import { detectAnomalies } from './src/weatherEngine/anomalyEngine.js';
import { calcStability } from './src/weatherEngine/stabilityEngine.js';
import { generateInsights } from './src/weatherEngine/insightEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── RATE LIMITER ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { success: false, message: 'Too many requests from this IP. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || process.env.VITE_WEATHER_API_KEY;

if (!WEATHER_API_KEY) {
    console.warn("⚠️  WARNING: WEATHER_API_KEY is missing! API requests to WeatherAPI will fail with a 400 error.");
}

const WEATHER_BASE = 'https://api.weatherapi.com/v1';
const OM_BASE = 'https://api.open-meteo.com/v1';

// ─── SIMPLE IN-MEMORY CACHE ──────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
function setCached(key, data) {
    cache.set(key, { data, ts: Date.now() });
}

// ─── HELPER: Fetch with Exponential Backoff ───────────────────────────────────────────
async function fetchWithBackoff(config, retries = 2, baseDelayMs = 500, timeout = 5000) {
    for (let i = 0; i <= retries; i++) {
        try {
            return await axios({ ...config, timeout });
        } catch (error) {
            // Do NOT retry on 4xx Client Errors (will deterministically fail again)
            if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
                console.warn(`⏳ [Backend] 🛑 Aborting retry for ${config.url} due to client error ${error.response.status}`);
                throw error;
            }
            if (i === retries) throw error;
            const delay = baseDelayMs * Math.pow(2, i);
            console.warn(`⏳ [Backend] Retry ${i+1}/${retries} for ${config.url} in ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// ─── HELPER: Geocode via Open-Meteo ────────────────────────────────────────────
async function fetchOpenMeteoGeocode(city) {
    const url = 'https://geocoding-api.open-meteo.com/v1/search';
    const params = { name: city, count: 1 };
    const res = await fetchWithBackoff({ method: 'GET', url, params });
    if (res.data && res.data.results && res.data.results.length > 0) {
        return { lat: res.data.results[0].latitude, lon: res.data.results[0].longitude, name: res.data.results[0].name };
    }
    throw new Error('Geocoding failed: City not found');
}

// ─── HELPER: Fetch Open-Meteo by coordinates ─────────────────────────────────
async function fetchOpenMeteo(lat, lon) {
    const url = `${OM_BASE}/forecast`;
    const params = {
        latitude: lat,
        longitude: lon,
        current_weather: true,
        hourly: 'temperature_2m,relativehumidity_2m,cloudcover,visibility,windspeed_10m',
        daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max',
        windspeed_unit: 'kmh',
        timezone: 'auto',
        forecast_days: 7
    };
    const res = await fetchWithBackoff({ method: 'GET', url, params });
    return res.data;
}

// ─── HELPER: Build 7-day merged forecast ────────────────────────────────────
function buildForecast(wapiForecast, omData) {
    const days = [];
    const omDaily = omData?.daily;

    for (let i = 0; i < 7; i++) {
        if (i < 3 && wapiForecast[i]) {
            // Days 1-3: blend WeatherAPI + Open-Meteo
            const wd = wapiForecast[i].day;
            const omMaxT = omDaily?.temperature_2m_max?.[i];
            const omMinT = omDaily?.temperature_2m_min?.[i];

            const maxC = omMaxT != null
                ? Math.round((wd.maxtemp_c * 0.6) + (omMaxT * 0.4))
                : Math.round(wd.maxtemp_c);
            const minC = omMinT != null
                ? Math.round((wd.mintemp_c * 0.6) + (omMinT * 0.4))
                : Math.round(wd.mintemp_c);

            days.push({
                date: wapiForecast[i].date,
                maxtemp_c: maxC,
                mintemp_c: minC,
                maxtemp_f: Math.round(maxC * 9 / 5 + 32),
                mintemp_f: Math.round(minC * 9 / 5 + 32),
                condition: wd.condition.text,
                astro: wapiForecast[i].astro,
                source: 'blended'
            });
        } else if (omDaily?.time?.[i]) {
            // Days 4-7: Open-Meteo only
            const code = omDaily.weathercode[i];
            let condition = 'Clear';
            if (code >= 1 && code <= 3) condition = 'Partly Cloudy';
            else if (code >= 45 && code <= 48) condition = 'Foggy';
            else if (code >= 51 && code <= 67) condition = 'Rainy';
            else if (code >= 71 && code <= 77) condition = 'Snowy';
            else if (code >= 95) condition = 'Thunderstorm';

            const maxC = Math.round(omDaily.temperature_2m_max[i]);
            const minC = Math.round(omDaily.temperature_2m_min[i]);
            days.push({
                date: omDaily.time[i],
                maxtemp_c: maxC,
                mintemp_c: minC,
                maxtemp_f: Math.round(maxC * 9 / 5 + 32),
                mintemp_f: Math.round(minC * 9 / 5 + 32),
                condition,
                astro: null,
                source: 'open-meteo'
            });
        }
    }
    return days;
}

// ─── ENDPOINT: /api/weather ────────────────────────────────────────────────────
app.get('/api/weather', async (req, res) => {
    let { lat, lon, q } = req.query;
    
    if (lat && lon && lat !== 'undefined' && lon !== 'undefined') {
        q = `${lat},${lon}`;
    }

    if (!q || typeof q !== 'string' || q.trim() === '' || q === 'undefined' || q === 'null') {
         return res.status(400).json({ success: false, message: 'Invalid or missing location query.' });
    }

    // Check cache
    const cacheKey = `fused:${q.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);
    if (cached) {
        console.log(`✅ [CACHE HIT] Served ${cacheKey} directly from memory. Saved API calls!`);
        return res.json({ success: true, data: { ...cached, _cached: true } });
    } else {
        console.log(`⏳ [CACHE MISS] Fetching fresh data for ${cacheKey}...`);
    }

    try {
        let wapiData = null;
        let resolvedLat = lat;
        let resolvedLon = lon;
        let cityName = q;

        // Step 1: Fetch WeatherAPI (primary)
        if (WEATHER_API_KEY) {
            try {
                const wapiRes = await fetchWithBackoff({
                    method: 'GET',
                    url: `${WEATHER_BASE}/forecast.json`,
                    params: { key: WEATHER_API_KEY, q, days: 3, aqi: 'yes', alerts: 'no' }
                });
                wapiData = wapiRes.data;
                resolvedLat = wapiData.location.lat;
                resolvedLon = wapiData.location.lon;
                cityName = wapiData.location.name;
            } catch (error) {
                console.warn('⚠️ [WeatherAPI] Fetch failed:', error.response?.data?.error?.message || error.message);
                // Graceful degradation: Do NOT throw, let Open-Meteo handle it
            }
        }

        // Step 1b: Geocode via Open-Meteo if WeatherAPI failed to provide lat/lon
        if (!wapiData && (!resolvedLat || !resolvedLon)) {
            console.log(`🌍 [Geocoding] Resolving coordinates for "${q}" via Open-Meteo...`);
            try {
                const geo = await fetchOpenMeteoGeocode(q);
                resolvedLat = geo.lat;
                resolvedLon = geo.lon;
                cityName = geo.name;
            } catch (error) {
                console.error('❌ [Geocoding] Failed:', error.message);
            }
        }

        // Step 2: Fetch Open-Meteo in parallel using the resolved coordinates
        let omData = null;
        if (resolvedLat && resolvedLon) {
            try {
                omData = await fetchOpenMeteo(resolvedLat, resolvedLon);
            } catch (e) {
                console.warn('⚠️ [Open-Meteo] Fetch failed:', e.response?.data || e.message);
            }
        }

        // ❌ Step 2b: Ultimate failure check
        if (!wapiData && !omData) {
            return res.status(502).json({ success: false, message: 'All weather data sources are currently unavailable.' });
        }

        // Step 3: Normalize and Synthesize missing blocks
        if (!wapiData && omData) {
            console.log('🔄 [Fallback] Synthesizing fake WeatherAPI UI block from Open-Meteo data...');
            wapiData = synthesizeWeatherApiRaw(omData, cityName);
            wapiData._synthesized = true;
        }

        const primarySnap = normalizeWeatherAPI(wapiData);
        if (wapiData._synthesized) primarySnap.source = 'Synthesized (Open-Meteo)';
        
        const secondarySnap = omData ? normalizeOpenMeteo(omData) : { source: 'Open-Meteo', temp: null };

        // Step 4: Fuse
        const fused = fuseSnapshots(primarySnap, secondarySnap);

        // Step 5: Smart condition engine (v2 - returns {condition, emoji})
        fused._raw_condition = wapiData.current.condition.text;
        fused.uv = fused.uv ?? wapiData.current.uv;  // Ensure UV is in fused object
        const { condition, emoji: conditionEmoji } = deriveCondition(fused);
        const conditionIcon = conditionToIcon(condition);

        // Step 5b: RealFeel (AccuWeather-style perceived temperature)
        const realFeel = calcRealFeel(fused.temp, fused.humidity, fused.wind_kph, fused.uv);
        const realFeelDesc = realFeelDescriptor(realFeel);
        
        // Step 5c: Apply data smoothing
        const cityKey = (fused.city || q).toLowerCase().replace(/\s+/g, '_');
        const smoothedTemp = applySmoothing(cityKey, fused.temp);

        // Step 6: AQI
        const aqiValue = resolveAQI(wapiData.current.air_quality);
        const aqiCategory = aqiValue != null ? categorizeAQI(aqiValue) : { label: 'N/A', color: '#888', emoji: '⚪' };
        const aqiTip = aqiValue != null ? getAQIHealthTip(aqiValue) : '';

        // Step 7: Confidence (v2 - includes reason)
        const confidence = calculateConfidence(fused.temp_diff, fused.sources_used.length);

        // Step 8: Build 7-day merged forecast
        const forecast7 = buildForecast(wapiData.forecast.forecastday, omData);


        // ── INTELLIGENCE LAYER ────────────────────────────────────────────────────
        // Step I1: Record snapshot into per-city ring buffer (reuses cityKey from step 5c)
        const aqiValueForTrend = resolveAQI(wapiData.current.air_quality);
        recordSnapshot(cityKey, {
            temp:        fused.temp,
            humidity:    fused.humidity,
            pressure_mb: fused.pressure_mb,
            aqi:         aqiValueForTrend ?? 0,
            visibility:  fused.visibility
        });

        // Step I2: Compute trend slopes
        const trends = getTrends(cityKey);

        // Step I3: Predict next hour
        const { predicted_temp, predicted_condition, temp_direction, prediction_confidence } =
            predictNextHour({ ...fused, condition, aqi: aqiValueForTrend }, trends);

        // Step I4: Rain probability
        const { rain_probability, rain_score, rain_factors } = calcRainProbability(
            fused.humidity, trends.pressure_trend, fused.cloud,
            fused.visibility, fused.precip_mm
        );

        // Step I5: Anomaly detection
        const { anomalies, severity: anomaly_severity } = detectAnomalies(
            trends, { ...fused, aqi: aqiValueForTrend }
        );

        // Step I6: Stability classification
        const buf = getBuffer(cityKey);
        const { stability, temp_variance, stability_score } = calcStability(buf);

        // Step I7: Generate contextual insights
        const insights = generateInsights(
            { ...fused, aqi: aqiValueForTrend, condition },
            trends, anomalies, rain_probability
        );

        // Step 9: Assemble final response
        const now = new Date();
        const response = {
            // ── Fused core fields ──
            temp: smoothedTemp,
            feels_like: realFeel,
            feels_like_desc: realFeelDesc,
            humidity: fused.humidity,
            wind_kph: fused.wind_kph,
            wind_dir: fused.wind_dir,
            wind_degree: fused.wind_degree,
            cloud: fused.cloud,
            visibility: fused.visibility,
            uv: fused.uv,
            is_day: fused.is_day,
            precip_mm: fused.precip_mm,
            pressure_mb: fused.pressure_mb,

            // ── Smart condition (v2) ──
            condition,
            condition_emoji: conditionEmoji,
            condition_icon: conditionIcon,

            // ── AQI ──
            aqi: aqiValue,
            aqi_category: aqiCategory.label,
            aqi_color: aqiCategory.color,
            aqi_emoji: aqiCategory.emoji,
            aqi_tip: aqiTip,
            co: wapiData.current.air_quality?.co ?? null,

            // ── Confidence (v2 with reason) ──
            confidence: confidence.level,
            confidence_label: confidence.label,
            confidence_color: confidence.color,
            confidence_icon: confidence.icon,
            confidence_reason: confidence.reason,
            sources_used: fused.sources_used,
            sources_count: fused.sources_used.length,

            // ── Location ──
            city: fused.city,
            country: fused.country,
            lat,
            lon,

            // ── Datetime ──
            last_updated: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            timestamp: now.toISOString(),

            // ── Sun times (from WeatherAPI astro) ──
            sunrise: wapiData.forecast.forecastday[0]?.astro?.sunrise ?? null,
            sunset: wapiData.forecast.forecastday[0]?.astro?.sunset ?? null,

            // ── 7-day forecast ──
            forecast7,

            // ── Intelligence Layer ──
            predicted_temp,
            predicted_condition,
            temp_direction,
            prediction_confidence,
            rain_probability,
            rain_score,
            rain_factors,
            stability,
            temp_variance,
            stability_score,
            anomalies,
            anomaly_severity,
            insights,
            trends,

            // ── Raw WeatherAPI (so existing frontend components still work) ──
            raw: wapiData
        };

        setCached(cacheKey, response);
        res.json({ success: true, data: response });

    } catch (error) {
        const message = error.response?.data?.error?.message || error.message;
        console.error('Fusion engine error:', message, error.response?.data || '');
        res.status(error.response?.status || 500).json({ success: false, message: 'Failed to fetch weather data: ' + message });
    }
});

// ─── EXISTING ENDPOINTS (preserved for backward compatibility) ────────────────



app.get('/api/history', async (req, res) => {
    const { q, dt } = req.query;
    if (!q || typeof q !== 'string' || q.trim() === '' || q === 'undefined' || q === 'null' || !dt) {
         return res.status(400).json({ error: 'City "q" and date "dt" (YYYY-MM-DD) are required and must be valid strings' });
    }
    try {
        const response = await axios.get(`${WEATHER_BASE}/history.json`, {
            params: { key: WEATHER_API_KEY, q, dt, aqi: 'yes' }
        });
        res.json(response.data);
    } catch (error) {
        const apiMsg = error.response?.data?.error?.message || error.message;
        console.error(`[WeatherAPI] History fetch failed for ${dt}: ${apiMsg}`);
        if (error.response) res.status(error.response.status).json(error.response.data);
        else res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim() === '' || q === 'undefined' || q === 'null') {
         return res.status(400).json({ error: 'Query parameter "q" is required and must be a valid string' });
    }
    try {
        const response = await axios.get(`${WEATHER_BASE}/search.json`, {
            params: { key: WEATHER_API_KEY, q }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching search data:', error.message);
        if (error.response) res.status(error.response.status).json(error.response.data);
        else res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`🌤️  SkyGlass Multi-Source Engine running on port ${PORT}`);
});
