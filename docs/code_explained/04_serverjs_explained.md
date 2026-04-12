# ⚙️ server.js — Line by Line

> **File:** `server.js` (project root)
> **Job:** Run the backend server that handles all API calls, coordinates all 12 intelligence engines, manages caching, and sends the final processed weather data to the browser.

---

## What This File Does

Your browser cannot talk directly to WeatherAPI or Open-Meteo — that would expose your secret API keys to anyone who inspects the page. Instead, the browser talks to YOUR server, which talks to the external APIs. The server is the trusted middleman.

**Analogy:** A 5-star hotel concierge. Guests (browser) ask for things ("Get me weather for Mumbai"). The concierge (server.js) contacts multiple services (WeatherAPI + Open-Meteo), collects the information, polishes it, and delivers a perfect response. The guest never needs to contact the services directly.

---

## Lines 1–15 — Imports

```js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
```

`import X from 'Y'` = ES Module import syntax. Loads an external library or module.

- `express` = the web server framework. Makes it easy to define routes and handle requests.
- `cors` = Cross-Origin Resource Sharing middleware. Allows the browser (on one URL) to talk to this server (on a different URL/port) — browsers block this by default for security.
- `dotenv` = reads the `.env` file and puts its values into `process.env`. This is how secret API keys are loaded.
- `path` = built-in Node.js module for working with file/folder paths.
- `fileURLToPath` = converts a `file://` URL to a normal filesystem path (needed in ES Modules).

```js
import { normalizeWeatherAPI, normalizeOpenMeteo, synthesizeWeatherApiRaw } from './src/weatherEngine/normalizer.js';
```

Imports the three normalisation functions from our custom normalizer module. The `{ }` syntax means "import these specific exports" (named imports).

```js
dotenv.config();
```

Reads the `.env` file. After this line, `process.env.WEATHER_API_KEY` etc. are available. If `.env` doesn't exist or a key is missing, they'll be `undefined`.

---

## Lines 17–25 — App Setup

```js
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

`express()` — Creates the Express application instance. Think of it as the server itself being born.

`process.env.PORT || 3000` — Use the PORT environment variable if it exists (cloud platforms like Render set this), otherwise use 3000 for local development.

`__filename` and `__dirname` — In ES Modules (using `import`), `__dirname` doesn't exist automatically (it does in older CommonJS `require()` style). These two lines recreate it:
- `import.meta.url` = the URL of the current file (e.g., `file:///D:/project/server.js`)
- `fileURLToPath(...)` = converts to filesystem path (`D:\project\server.js`)
- `path.dirname(...)` = gets the directory (`D:\project`)

---

## Lines 27–30 — Middleware

```js
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));
```

`app.use(...)` = "use this middleware for all requests." Middleware runs for every request before the route handler.

`cors()` — Adds the `Access-Control-Allow-Origin: *` header to all responses. This tells browsers "it's OK to access this server from any origin."

`express.json()` — Parses incoming JSON request bodies. If someone POSTs JSON to the server, this makes it available as `req.body`.

`express.static(...)` — Serves static files (HTML, CSS, JS, images) directly from the given folder. When the browser requests `style.css`, Express finds and sends it automatically without you writing a route for it.

---

## Lines 33–38 — Cache Setup

```js
const weatherCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds
```

`new Map()` — An in-memory cache. Key = city name. Value = `{ data: {...}, timestamp: ... }`.

`CACHE_TTL = 10 * 60 * 1000` = 600,000 milliseconds = 10 minutes. If you request the same city within 10 minutes, the server returns cached data instead of calling the APIs again. This saves API quota and speeds up response time.

---

## Lines 40–55 — The Main API Route

```js
app.get('/api/weather', async (req, res) => {
    const q = req.query.q;
    if (!q) {
        return res.status(400).json({ error: 'Query parameter q is required' });
    }
```

`app.get('/api/weather', ...)` — Defines a GET route. When the browser requests `http://localhost:3000/api/weather?q=Mumbai`, this function runs.

`async (req, res) => { ... }` — An asynchronous arrow function. `async` allows using `await` inside it.
- `req` = the incoming request object (contains URL, headers, query params, body)
- `res` = the response object (used to send data back)

`req.query.q` — Gets the `q` parameter from the URL query string (`?q=Mumbai` → `q = "Mumbai"`).

`res.status(400).json({...})` — Sends a 400 (Bad Request) response with a JSON error message. `return` stops execution here.

---

## Lines 57–74 — Cache Check

```js
    const cacheKey = q.toLowerCase().trim();
    const cached = weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log(`[CACHE HIT] ${q}`);
        return res.json(cached.data);
    }
```

`q.toLowerCase().trim()` — Normalise the city name: "  Mumbai  " and "MUMBAI" and "mumbai" all become the same cache key `"mumbai"`.

`weatherCache.get(cacheKey)` — Try to find a cached response.

`Date.now() - cached.timestamp < CACHE_TTL` — Is the cached data less than 10 minutes old? If yes → return cached data immediately without calling any APIs.

`console.log(...)` — Logs to the server terminal (not visible in browser). Useful for debugging.

---

## Lines 76–120 — Parallel API Fetching

```js
    const WAPI_KEY = process.env.WEATHER_API_KEY;
    const wapiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${WAPI_KEY}&q=${q}&days=3&aqi=yes&alerts=yes`;
    const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=...`;

    const [wapiResult, omResult] = await Promise.allSettled([
        fetch(wapiUrl).then(r => r.json()),
        fetch(omUrl).then(r => r.json())
    ]);
```

`process.env.WEATHER_API_KEY` — The API key from `.env`. Never hardcoded.

Template literal URL construction — the URL is built using `${}` to embed variables. The final URL might look like:
```
https://api.weatherapi.com/v1/forecast.json?key=abc123&q=Mumbai&days=3&aqi=yes
```

`Promise.allSettled([fetch1, fetch2])` — This is the key to parallel fetching:
- Sends BOTH API requests **simultaneously** (not one after the other)
- Waits for BOTH to complete (or fail)
- Returns an array of results — each is either `{ status: 'fulfilled', value: data }` or `{ status: 'rejected', reason: error }`

`await` — Pauses execution until `Promise.allSettled` resolves. During the wait, Node.js can handle other requests (it doesn't freeze).

This is why the app asks WeatherAPI AND Open-Meteo at the same time — if they ran sequentially, you'd wait twice as long.

---

## Lines 122–160 — Handling Results

```js
    let wapiData = null, omData = null;

    if (wapiResult.status === 'fulfilled') {
        wapiData = wapiResult.value;
        if (wapiData.error) {
            wapiData = null;
        }
    }

    if (omResult.status === 'fulfilled') {
        omData = omResult.value;
    }
```

`wapiResult.status === 'fulfilled'` — Did WeatherAPI respond successfully?

`wapiData.error` — WeatherAPI returns `{ error: { code: 1006, message: "No location found" } }` for invalid cities rather than throwing an HTTP error. We check for this explicitly.

If either API fails, its data is set to `null`. The next section handles the null cases.

---

## Lines 162–200 — Normalisation and Fallbacks

```js
    let primarySnap = null, secondarySnap = null, rawWeatherApiData = null;

    if (wapiData) {
        primarySnap = normalizeWeatherAPI(wapiData);
        rawWeatherApiData = wapiData;
    }

    if (omData) {
        // Resolve lat/lon from whichever source worked
        omData.latitude = omData.latitude ?? (wapiData?.location?.lat);
        secondarySnap = normalizeOpenMeteo(omData);
    }

    // Fallback: if WeatherAPI failed, synthesise fake raw data from Open-Meteo
    if (!primarySnap && secondarySnap) {
        rawWeatherApiData = synthesizeWeatherApiRaw(omData, q);
        primarySnap = normalizeWeatherAPI(rawWeatherApiData);
    }

    // Total failure
    if (!primarySnap) {
        return res.status(502).json({ error: 'Both weather sources failed. Please try again.' });
    }
```

**Decision tree:**
1. WeatherAPI works → use it as primary
2. Open-Meteo works → use as secondary
3. Only Open-Meteo worked → synthesise a fake WeatherAPI response from it (prevents frontend crash)
4. Both failed → return 502 error (Bad Gateway)

`wapiData?.location?.lat` — Optional chaining. If `wapiData` is null, this returns `undefined` instead of throwing.

---

## Lines 202–250 — Running the Engines

```js
    const cityKey = primarySnap.city?.toLowerCase().replace(/\s+/g, '_') || cacheKey;
    
    // Fusion
    let fused;
    if (secondarySnap) {
        fused = fuseSnapshots(primarySnap, secondarySnap);
    } else {
        fused = { ...primarySnap, sources_used: [primarySnap.source], temp_diff: 0 };
    }

    fused._raw_condition = primarySnap.condition_text;

    // Trend recording
    recordSnapshot(cityKey, {
        temp: fused.temp,
        humidity: fused.humidity,
        pressure_mb: fused.pressure_mb,
        aqi: fused.aqi,
        visibility: fused.visibility
    });

    const trends = getTrends(cityKey);
    const buffer = getBuffer(cityKey);
```

`cityKey` = `"mumbai"`, `"new_delhi"`, etc. Used as the key for the trend buffer and caching.

`/\s+/g` = a **regular expression**. `\s+` = one or more whitespace characters. `g` = global (replace ALL occurrences). `replace(/\s+/g, '_')` converts `"New Delhi"` → `"new_delhi"`.

If both sources worked → fuse them. If only one → use it directly as-is (spread into a compatible structure).

`fused._raw_condition` = we attach the raw API condition text (like `"Overcast"`) to the fused object. The conditionEngine uses this for precipitation detection.

Then: all 5 relevant fields are recorded in the trend buffer.
Then: trends are calculated from the buffer.
Then: the raw buffer is fetched (for the stabilityEngine).

---

## Lines 252–290 — Calling All Engines

```js
    const { condition, emoji }             = deriveCondition(fused);
    const { stability, temp_variance, ... } = calcStability(buffer);
    const realFeel                         = calcRealFeel(fused.temp, fused.humidity, fused.wind_kph, fused.uv);
    const smoothedTemp                     = applySmoothing(cityKey, fused.temp);
    const rfDescriptor                     = realFeelDescriptor(realFeel);
    const confidence                       = calculateConfidence(fused.temp_diff, fused.sources_used.length);
    const { rain_probability, rain_score, rain_factors } = calcRainProbability(...);
    const { anomalies, severity }          = detectAnomalies(trends, fused);
    const prediction                       = predictNextHour(fused, trends);
    const insights                         = generateInsights(fused, trends, anomalies, rain_probability);
```

Each engine is called one by one. The **outputs** of earlier engines feed into later ones:
- `trends` (from trendEngine) → feeds anomalyEngine, predictionEngine, insightEngine
- `rain_probability` (from rainEngine) → feeds insightEngine
- `anomalies` (from anomalyEngine) → feeds insightEngine

This is the **Intelligence Pipeline**.

---

## Lines 293–360 — Building the Response

```js
    const responseData = {
        // Raw frontend-compatible data
        weather: rawWeatherApiData,

        // Intelligence outputs
        fused,
        condition,
        condition_emoji: emoji,
        real_feel: realFeel,
        real_feel_descriptor: rfDescriptor,
        smoothed_temp: smoothedTemp,
        aqi_category: categorizeAQI(fused.aqi).label,
        aqi_health_tip: getAQIHealthTip(fused.aqi),
        confidence_label: confidence.label,
        confidence_icon: confidence.icon,
        sources_count: fused.sources_used?.length,
        rain_probability,
        rain_factors,
        stability,
        anomalies,
        severity,
        insights,
        ...prediction,
        trends
    };

    // Cache it
    weatherCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    res.json(responseData);
```

`...prediction` = **spread** — expands all fields from the prediction object directly into `responseData`. So `predicted_temp`, `predicted_condition`, `temp_direction`, `prediction_confidence` all appear at the top level.

`weatherCache.set(cacheKey, { data: responseData, timestamp: Date.now() })` — Store the complete response with current timestamp. Next request within 10 minutes returns this directly.

`res.json(responseData)` — Sends the entire object as a JSON HTTP response to the browser.

---

## Line 365 — Starting the Server

```js
app.listen(PORT, () => {
    console.log(`🌤️ SkyGlass Server running at http://localhost:${PORT}`);
});
```

`app.listen(PORT, callback)` — Starts the server on the specified port. The callback runs once the server is ready. Template literal logs the URL.

After this line runs, the server is live and waiting for browser requests.

---

## What Happens Next

The browser receives the `responseData` JSON. `script.js` reads each field and updates the corresponding HTML elements on the dashboard.

---

*Next: [03_scriptjs_explained.md](../03_scriptjs_explained.md)*
