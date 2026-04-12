# ⚡ Viva Summary — Memorize This

> Read this the night before your viva. Everything important, compressed.

---

## The One Sentence Description

> **SkyGlass is a full-stack weather intelligence system that fetches data from two independent APIs, fuses them using weighted mathematics, runs 12 analysis engines to compute rain probability, trends, predictions, AQI, and danger alerts, then delivers a rich, human-readable dashboard secured behind a Node.js backend.**

---

## The 10 Key Points (Learn These Cold)

| # | Point | One Line Explanation |
|---|---|---|
| 1 | **Two-Source Fusion** | WeatherAPI (60%) + Open-Meteo (40%) blended for accuracy |
| 2 | **Normalizer** | Translates both API formats into one standard structure |
| 3 | **Weighted Average** | Different fields get different trust levels based on source reliability |
| 4 | **Outlier Removal** | If sources disagree by >5°C, secondary is discarded |
| 5 | **12 Intelligence Engines** | Each solves one specific problem (rain, AQI, trend, anomaly...) |
| 6 | **Ring Buffer** | Fixed 12-entry memory for trend tracking — old data auto-erased |
| 7 | **Linear Regression** | Math formula to find slope (rising/falling/stable) from the buffer |
| 8 | **Caching (TTL)** | Results stored for 10 minutes — repeat searches return instantly |
| 9 | **Rate Limiting** | Max 100 requests per IP per 10 minutes — prevents abuse |
| 10 | **API Key Security** | Keys live only in .env on server — browser never sees them |

---

## The 3 APIs — What Each One Does

| API | Free? | What SkyGlass Gets From It |
|---|---|---|
| WeatherAPI.com | Free key required | Current conditions + AQI + 3-day forecast + history + search |
| Open-Meteo.com | Completely free | 7-day forecast + hourly data + geocoding |
| OpenWeatherMap | Free key required | Map tile overlays (cloud/rain images on the interactive map) |

---

## The 12 Engines — One Line Each

| Engine | What It Computes |
|---|---|
| `normalizer.js` | Converts both API responses to identical format |
| `fusionEngine.js` | Blends two sources using weighted maths |
| `conditionEngine.js` | Derives weather label from raw numbers (not API text) |
| `realFeelEngine.js` | Calculates perceived temperature (heat index + wind chill + UV) |
| `aqiHandler.js` | Converts pollutant readings to AQI score + category + health tip |
| `confidenceCalc.js` | Scores data reliability based on source agreement |
| `trendEngine.js` | Ring buffer + linear regression → ↑↓→ trend direction |
| `predictionEngine.js` | Extrapolates current trend 1 hour into the future |
| `rainEngine.js` | 5-factor scoring → rain probability % |
| `anomalyEngine.js` | Threshold checks → danger alerts (heat, fog, AQI, wind) |
| `stabilityEngine.js` | Variance of buffer readings → Stable / Unsettled / Volatile |
| `insightEngine.js` | Converts all metrics into prioritized plain-English sentences |

---

## The Architecture — Frontend vs Backend

```
FRONTEND (runs in browser)         BACKEND (runs on server)
─────────────────────────          ────────────────────────
index.html   → structure           server.js → API, cache, engines
style.css    → design              .env      → secret API keys
script.js    → UI logic            src/weatherEngine/ → 12 engines
mapUtils.js  → map                 
storageUtils → localStorage        
```

---

## Key Formulas to Know

### Weighted Average (Fusion)
```
FusedTemp = (WeatherAPI_Temp × 0.60) + (OpenMeteo_Temp × 0.40)
```

### Outlier Rule
```
IF |Primary_Temp - Secondary_Temp| > 5°C → ignore secondary
```

### Analog Clock Degrees (JavaScript)
```
Second hand: degrees = seconds × 6     (360° ÷ 60 seconds)
Minute hand: degrees = minutes × 6     (360° ÷ 60 minutes)
Hour hand:   degrees = hours × 30      (360° ÷ 12 hours)
```

### Cache TTL Calculation
```
Cache duration: 10 * 60 * 1000 = 600,000 milliseconds = 10 minutes
```

### Rain Score Cap
```
rain_probability = Math.min(100, Math.max(0, rawScore))
  → Always between 0 and 100
```

---

## The Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend language | HTML + CSS + JavaScript | Web standards — runs in any browser |
| Frontend build tool | Vite | Bundles + minifies code for production |
| Backend runtime | Node.js | Runs JavaScript on the server |
| Backend framework | Express.js | Makes routing and server setup simple |
| HTTP client (server) | Axios | More reliable than fetch for server-side requests |
| Charting | Chart.js | Powerful, customizable graphs |
| Map | Leaflet.js | Open-source interactive maps |
| Deployment (full) | Render | Runs the full backend server |
| Deployment (static) | Vercel | Serves only the frontend from global CDN |

---

## Deployment — Render vs Vercel

| | Render | Vercel |
|---|---|---|
| **Runs the backend?** | ✅ Yes | ❌ No |
| **API calls work?** | ✅ Yes | ❌ No |
| **Best for** | Full production experience | Fast frontend delivery only |
| **Free tier behaviour** | Sleeps after inactivity | Always awake |

**Primary link to share:** Render (full stack)
**Secondary/backup:** Vercel (frontend only)

---

## Three Words For Each Component

| Component | Three Words |
|---|---|
| `server.js` | Request, Process, Respond |
| `script.js` | Listen, Fetch, Display |
| `normalizer.js` | Translate, Standardize, Simplify |
| `fusionEngine.js` | Blend, Weight, Protect |
| `trendEngine.js` | Remember, Calculate, Indicate |
| `insightEngine.js` | Prioritize, Translate, Advise |
| Cache | Store, Reuse, Expire |
| API Key | Secret, Protected, Server-only |

---

*Next: [09_viva_questions.md](./09_viva_questions.md) — Teacher's Questions + Model Answers*
