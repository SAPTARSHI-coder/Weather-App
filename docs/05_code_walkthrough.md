# 📖 Code Walkthrough — Every Important File Explained

> You don't need to know programming. This explains what each block of code is DOING and WHY, in plain English.

---

## File 1: `server.js` — The Brain of the Backend

This is the most important backend file. Let's walk through it section by section.

---

### Section A — Importing Tools (Lines 1–23)

```js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
```

**What this is doing:**
This is like a chef gathering tools before cooking. Each `import` brings in a tool from the toolbox (`node_modules`):

| Tool | What It Does |
|---|---|
| `express` | Creates the web server — makes your computer "listen" for browser requests |
| `cors` | Tells browsers: "Yes, this server allows requests from other websites" |
| `dotenv` | Reads the `.env` file and loads the secret API keys into the program |
| `axios` | A helper for making HTTP requests (like `fetch`, but more powerful, for servers) |
| `rateLimit` | Limits how many requests each user can make per hour |

Then we import all 12 custom intelligence engines:
```js
import { normalizeWeatherAPI, normalizeOpenMeteo } from './src/weatherEngine/normalizer.js';
import { fuseSnapshots } from './src/weatherEngine/fusionEngine.js';
// ... and so on for all 12 engines
```

> **Analogy:** Like a surgeon calling in each specialist before an operation: "I'll need the cardiologist, the anaesthetist, the radiologist..." Each specialist is one engine file.

---

### Section B — Setting Up The Server (Lines 27–44)

```js
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

**Step by step:**

1. `const app = express()` — Creates the server object. Think: "Build me a server."
2. `const PORT = 3001` — The server will listen on port 3001. Think of port as a "door number" on a building.
3. `app.use(cors())` — Allows browser requests to reach this server.
4. `app.use(express.json())` — Tells the server to understand JSON-formatted messages.
5. `app.listen(3001)` — Opens the door. The server is now live on port 3001.

> **Analogy:** Opening a restaurant. Step 1: Get the building (express). Step 2: Assign a door number (port 3001). Step 3: Unlock the front door (app.listen). Now customers can walk in.

---

### Section C — The Cache System (Lines 56–70)

```js
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

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
```

**What this is doing:** Think of `cache` as a **notebook**.

- `setCached("fused:mumbai", data)` → Write the Mumbai result in the notebook, note the current time.
- `getCached("fused:mumbai")` → Check the notebook. If it was written less than 10 minutes ago → return it. If older than 10 minutes → tear out the page and return null (meaning "go fetch fresh data").

`10 * 60 * 1000` — This is 10 minutes expressed in milliseconds (the unit computers use).
- 10 minutes × 60 seconds × 1000 milliseconds = 600,000 ms

---

### Section D — The Main API Endpoint (Lines 176–414)

```js
app.get('/api/weather', async (req, res) => {
```

This line says: *"When a browser visits `/api/weather`, run this function."*

`async` means: *"This function will wait for slow things (like API calls) without freezing."*

`req` = the request (the incoming message from the browser)
`res` = the response (what we send back to the browser)

**Inside this function, step by step:**

```js
let { lat, lon, q } = req.query;
```
→ Read the query parameters from the URL. E.g., `/api/weather?q=Mumbai` → `q = "Mumbai"`.

```js
const cacheKey = `fused:${q.toLowerCase().trim()}`;
const cached = getCached(cacheKey);
if (cached) return res.json({ success: true, data: cached });
```
→ Check the cache. If data is fresh → return it immediately without calling any APIs.

```js
const wapiRes = await fetchWithBackoff({
    url: `https://api.weatherapi.com/v1/forecast.json`,
    params: { key: WEATHER_API_KEY, q, days: 3, aqi: 'yes' }
});
```
→ Call WeatherAPI. `await` means: "Wait here until WeatherAPI replies before continuing." This takes about 300–500 ms.

```js
omData = await fetchOpenMeteo(resolvedLat, resolvedLon);
```
→ Call Open-Meteo using the coordinates we got from WeatherAPI.

```js
const primarySnap = normalizeWeatherAPI(wapiData);
const secondarySnap = normalizeOpenMeteo(omData);
const fused = fuseSnapshots(primarySnap, secondarySnap);
```
→ Normalize both (translate to common format) → Fuse them (blend mathematically).

Then all 12 engines run:
```js
const { condition, emoji } = deriveCondition(fused);
const realFeel = calcRealFeel(fused.temp, fused.humidity, fused.wind_kph, fused.uv);
const aqiValue = resolveAQI(wapiData.current.air_quality);
// ... 9 more engines ...
```
→ Each engine receives data → computes something → returns a result → saved into variables.

Finally:
```js
const response = {
    temp: smoothedTemp,
    feels_like: realFeel,
    rain_probability,
    insights,
    // ... all ~40 fields
    raw: wapiData
};

setCached(cacheKey, response);    // Save to cache
res.json({ success: true, data: response }); // Send to browser
```
→ Package everything into one big object → cache it → send it to the browser.

---

## File 2: `script.js` — The Frontend Brain (Browser Side)

This runs inside your browser. It cannot be hidden from users — but all sensitive logic is on the server.

---

### Section A — Imports (Lines 1–9)

```js
import Chart from 'chart.js/auto';
import L from 'leaflet';
import { initMap, updateMap } from './mapUtils.js';
import { saveCity, getSavedCities } from './storageUtils.js';
```

This brings in:
- **Chart.js** — the charting library (for drawing temperature graphs)
- **Leaflet** — the map library (for the interactive map)
- **mapUtils** — our custom map helper functions
- **storageUtils** — our custom localStorage helper functions

---

### Section B — fetchWithRetry (Lines 22–37)

```js
async function fetchWithRetry(url, options = {}, retries = 2, timeoutMs = 5000) {
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(`${API_BASE_URL}${url}`, { ...options, signal: controller.signal });
            clearTimeout(id);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
        } catch (error) {
            clearTimeout(id);
            if (i === retries) throw error;
        }
    }
}
```

**What this does:**
Sends a request to the server. If it fails (network hiccup), it tries **up to 2 more times** before giving up.

- `AbortController` — a mechanism to cancel a request if it takes too long (5 seconds timeout)
- `retries = 2` — means it will try: 1st attempt → fail → 2nd try → fail → 3rd try → if still failing → throw error
- `res.json()` — reads the server's JSON response and converts it to a JavaScript object

> **Analogy:** Calling a friend. If no answer, you try again. After 3 attempts, you give up.

---

### Section C — The City Clock (Lines 94–138)

```js
function startCityClock(tzId, cityLabel) {
    cityClocktimezone = tzId;

    function tick() {
        const now = new Date();
        const cityTime = new Date(now.toLocaleString('en-US', { timeZone: tzId }));

        const h12 = cityTime.getHours() % 12 || 12;
        const min = cityTime.getMinutes();
        const sec = cityTime.getSeconds();

        // Digital display
        timeEl.textContent = `${String(h12).padStart(2,'0')}:${String(min).padStart(2,'0')}`;

        // Analog clock hands
        const secDeg = sec * 6;         // 60 seconds × 6° each = 360°
        const minDeg = min * 6 + sec * 0.1;
        const hrDeg  = (h12 % 12) * 30 + min * 0.5;

        secH.style.transform = `translateX(-50%) rotate(${secDeg}deg)`;
    }

    tick();
    cityClockInterval = setInterval(tick, 1000); // runs every 1 second
}
```

**What this does:**
Shows a live clock for the city you searched — both digital (numbers) and analog (rotating hands).

- `tzId` — the city's timezone (like "Asia/Kolkata" or "Europe/London") from WeatherAPI
- `toLocaleString('en-US', { timeZone: tzId })` — converts current time to that city's timezone
- `sec * 6` — a full clock circle is 360°. 60 seconds = 360°, so each second = 6°.
- `setInterval(tick, 1000)` — runs the tick function every 1000 milliseconds (every second)

---

### Section D — init() — The Startup Function (Lines 141–369)

```js
function init() {
    updateClock();
    setInterval(updateClock, 1000);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => { loadCity(`${pos.coords.latitude},${pos.coords.longitude}`); },
            (err) => { loadCity('Kolkata'); }  // fallback if GPS denied
        );
    }
}
```

This runs **once** when the page first loads. It:
1. Starts the local clock (ticking every second)
2. Asks the browser for your GPS location
3. If GPS is allowed → loads weather for your actual location
4. If GPS is denied → defaults to Kolkata

---

### Section E — loadCity() — The Core Function (Lines 439–473)

```js
async function loadCity(query) {
    isCityLoading = true;
    showDashboardState('loading');       // Show spinner

    const data = await fetchWithRetry(`/api/weather?q=${query}`);

    if (!data.success) throw new Error(data.message);

    updateUI(data.data.raw, data.data);  // Update all UI elements
    showDashboardState('success');       // Hide spinner, show dashboard
}
```

This is the function that runs every time you search for a city. It:
1. Shows the loading spinner
2. Calls the server and waits for data
3. If success → calls `updateUI()` which fills in every card on the dashboard
4. If error → shows an error message

---

### Section F — updateUI() — Filling The Dashboard (Lines 753+)

```js
async function updateUI(data, fused = null) {
    // Temperature
    document.getElementById('temperature').textContent = `${tempC}°C / ${tempF}°F`;

    // Condition – smart condition from engine, fallback to API text
    const smartCondition = fused?.condition ?? current.condition.text;
    document.getElementById('condition').textContent = smartCondition;

    // Confidence badge
    badge.innerHTML = `${fused.confidence_icon} ${fused.confidence_label}
                       · Sources: ${fused.sources_count}
                       · Updated: ${fused.last_updated}`;

    // Feels Like
    feelsEl.textContent = `Feels like ${Math.round(fused.feels_like)}°C`;

    // ... and ~35 more fields updated the same way
}
```

**What this does:**
Goes through the JSON response from the server and fills in every card, badge, and label on the page.

`document.getElementById('temperature')` — finds the HTML element with that ID.
`.textContent = "32°C"` — sets its text to the new value.

It's like filling in a form: find the field by name, write the value.

---

## File 3: `normalizer.js` — The Translator Engine

```js
export function normalizeWeatherAPI(data) {
    const c = data.current;
    const loc = data.location;
    return {
        source:      'WeatherAPI',
        temp:        c.temp_c,
        humidity:    c.humidity,
        wind_kph:    c.wind_kph,
        wind_dir:    c.wind_dir,
        cloud:       c.cloud,
        visibility:  c.vis_km,
        pressure_mb: c.pressure_mb,
        precip_mm:   c.precip_mm,
        is_day:      c.is_day,
        uv:          c.uv,
        city:        loc.name,
        country:     loc.country,
    };
}
```

**What this does:**
Takes WeatherAPI's deep nested response (e.g., `data.current.temp_c`) and re-packages it into a flat, simple object where all keys are standardized.

`export function` — means this function is available for `server.js` to import and use.

The Open-Meteo version does the same thing but translates from Open-Meteo's different structure.

---

## File 4: `fusionEngine.js` — The Blender Engine

```js
export function fuseSnapshots(primary, secondary) {
    const tempDiff = Math.abs(primary.temp - secondary.temp);

    let fusedTemp;
    if (secondary.temp === null || tempDiff > 5) {
        // Outlier: ignore secondary
        fusedTemp = primary.temp;
    } else {
        // Weighted blend
        fusedTemp = (primary.temp * 0.60) + (secondary.temp * 0.40);
    }

    return {
        temp:       fusedTemp,
        humidity:   primary.humidity,   // 100% trust WeatherAPI for humidity
        wind_kph:   (primary.wind_kph * 0.70) + (secondary.wind_kph * 0.30),
        cloud:      (primary.cloud * 0.50) + (secondary.cloud * 0.50),
        sources_used: ['WeatherAPI', 'Open-Meteo'],
        temp_diff:  tempDiff,
    };
}
```

**What this does line by line:**

1. Calculates the **difference** between the two temperature readings.
2. If the secondary source returned null (unavailable) OR they disagree by more than 5°C → **ignore the secondary source entirely**.
3. Otherwise → **blend** them: 60% primary + 40% secondary.
4. Humidity: always trust WeatherAPI (100%) because Open-Meteo's current-hour humidity is less accurate.
5. Cloud: trust both equally (50/50) because both use satellite data.
6. Returns the blended values + a list of which sources were used.

---

## File 5: `rainEngine.js` — The Umbrella Advisor Engine

```js
export function calcRainProbability(humidity, pressureTrend, cloudCover, visibility, precipMm) {
    let score = 0;
    const factors = [];

    // Factor 1: Humidity
    if (humidity >= 90) { score += 35; factors.push("Very high humidity"); }
    else if (humidity >= 80) { score += 20; factors.push("High humidity"); }

    // Factor 2: Pressure trend (falling pressure = storm coming)
    if (pressureTrend < -2) { score += 25; factors.push("Pressure falling rapidly"); }
    else if (pressureTrend < 0) { score += 10; factors.push("Pressure falling"); }

    // Factor 3: Cloud cover
    if (cloudCover >= 80) { score += 20; factors.push("Heavy cloud cover"); }
    else if (cloudCover >= 60) { score += 10; factors.push("Significant cloud cover"); }

    // Factor 4: Visibility (low vis = rain starting)
    if (visibility < 2) { score += 15; factors.push("Low visibility"); }

    // Factor 5: Current precipitation (strongest signal)
    if (precipMm > 2) { score += 40; factors.push("Active precipitation"); }
    else if (precipMm > 0) { score += 25; factors.push("Light precipitation"); }

    // Clamp between 0 and 100
    const rain_probability = Math.min(100, Math.max(0, score));

    return { rain_probability, rain_score: score, rain_factors: factors };
}
```

**What this does:**
- Starts with a score of 0.
- **Adds points** for each factor that increases rain likelihood.
- `Math.min(100, score)` — prevents score from going above 100 (probability can't exceed 100%).
- Returns the probability number AND a list of **which factors contributed** (so the UI can explain why).

> **The detective analogy again:** Each `if` block is a clue. The detective adds evidence to the case file. At the end, they tally up how strong the case for rain is.

---

*Next: [06_examples.md](./06_examples.md) — Real City Examples Explained*
