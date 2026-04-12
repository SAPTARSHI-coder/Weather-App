# ⚡ SkyGlass — One-Page Study Card
> Print this. Read it the morning of your viva. Everything on one page.

---

## 🎯 What Is SkyGlass? (Say This First)

> "SkyGlass is a full-stack weather intelligence system. It fetches data from two independent weather APIs, blends them using weighted maths, runs the result through 12 custom analysis engines, and displays a rich dashboard — all secured behind a Node.js server."

---

## 🔢 The Numbers

| What | Number |
|---|---|
| Weather APIs used | **3** (WeatherAPI, Open-Meteo, OpenWeatherMap) |
| Intelligence engines | **12** |
| Forecast days | **7** (3 blended + 4 Open-Meteo only) |
| History days | **7** |
| Response fields | **~40** |
| Cache TTL | **10 minutes** |
| Rate limit | **100 requests / 10 min / IP** |
| Outlier threshold | **5°C difference** |
| Ring buffer size | **12 entries** |
| WeatherAPI weight | **60%** |
| Open-Meteo weight | **40%** |

---

## 🔄 The Full Flow (7 Steps)

```
User types city
    ↓
script.js → GET /api/weather?q=City → server.js
    ↓
Cache check → HIT (return instantly) / MISS (continue)
    ↓
WeatherAPI call (3-day + AQI) + Open-Meteo call (7-day)
    ↓
normalizer.js → both into same format (Canonical Snapshot)
    ↓
fusionEngine.js → weighted blend (60/40), outlier removal
    ↓
12 engines run → condition, realfeel, aqi, trends, rain,
                 anomaly, stability, prediction, insights
    ↓
Final JSON (~40 fields) → cached → sent to browser
    ↓
script.js updates every card, badge, chart, map
```

---

## 🧠 12 Engines — One Line Each

| Engine | Job |
|---|---|
| `normalizer` | Same format from both APIs |
| `fusionEngine` | 60/40 weighted blend + outlier guard |
| `conditionEngine` | Weather label from numbers, not API text |
| `realFeelEngine` | Wind chill + heat index + UV = feels like X°C |
| `aqiHandler` | Pollutants → AQI 0–500 + tip |
| `confidenceCalc` | How reliable is this data? High/Medium/Low |
| `trendEngine` | Ring buffer + linear regression → ↑↓→ |
| `predictionEngine` | Slope × 1hr = next hour temperature |
| `rainEngine` | 5 factors scored → 0–100% rain probability |
| `anomalyEngine` | Threshold checks → 🔴 danger alerts |
| `stabilityEngine` | Buffer variance → Stable/Unsettled/Volatile |
| `insightEngine` | Numbers → plain English advice |

---

## 🔑 Key Formulas

```
Fused Temp   = (WeatherAPI × 0.60) + (Open-Meteo × 0.40)
Outlier Rule = if |A - B| > 5°C → discard secondary
Rain Score   = humidity_pts + pressure_pts + cloud_pts + vis_pts + precip_pts
Clamp        = Math.min(100, Math.max(0, score))
Clock hands  = seconds × 6°  |  minutes × 6°  |  hours × 30°
Cache TTL    = Date.now() - entry.ts > 600,000ms → stale
```

---

## 🏗️ Frontend vs Backend

| | Frontend | Backend |
|---|---|---|
| Runs in | Browser | Server (cloud) |
| Files | `index.html`, `style.css`, `script.js`, `mapUtils.js` | `server.js`, `src/weatherEngine/*.js` |
| Sees API key? | ❌ Never | ✅ Yes (.env only) |
| Does computation? | No | Yes (all 12 engines) |

---

## 🌐 3 APIs & Their Jobs

| API | Key? | Job |
|---|---|---|
| WeatherAPI.com | ✅ Yes | Current + 3-day + AQI + history + search |
| Open-Meteo.com | ❌ Free | 7-day forecast + hourly data |
| OpenWeatherMap | ✅ Yes | Map tile overlays (clouds/rain images) |

---

## 🚀 Deployment

| | Render | Vercel |
|---|---|---|
| Backend runs? | ✅ Yes | ❌ No |
| Best for | Full production | Fast frontend CDN |
| Cold start? | Yes (free tier) | No |

---

## ⚡ Why Caching?

Without: 50 users search Mumbai → **100 API calls**, slow
With: 50 users search Mumbai → **2 API calls**, instant after first

---

## ⚡ Why a Backend Server?

1. **Security** — API key hidden from browser
2. **CORS** — server-to-server requests bypass browser restrictions
3. **Power** — 12 engines can't run efficiently in the browser

---

## ⚡ Why Weighted Average (not 50/50)?

Because WeatherAPI uses local ground stations → more reliable for current conditions.
Open-Meteo uses satellite models → better for long range.
Not all sources deserve equal trust.

---

## ⚡ Why Ring Buffer (not growing array)?

Memory is bounded (always 12 entries max).
Old data is irrelevant — only the most recent 12 readings matter for trends.

---

## ⚡ Why 12 Separate Engine Files?

Single Responsibility Principle.
Each file does one thing → easy to read, test, debug, and replace independently.

---

## 🎓 If Teacher Asks "What is...?"

| Term | One-line answer |
|---|---|
| **API** | Two programs talking to each other over the internet |
| **API Key** | A secret password granting access to a service |
| **Backend** | Code on a server — handles data, security, logic |
| **Caching** | Saving results to return instantly next time |
| **Canonical Schema** | One standard data format everyone agrees to use |
| **CORS** | Browser security rule blocking cross-site requests |
| **Heat Index** | Formula: high humidity makes temp feel hotter |
| **JSON** | Text format for exchanging data between programs |
| **Linear Regression** | Math formula finding slope (direction of change) |
| **Node.js** | JavaScript running on a server, not a browser |
| **Ring Buffer** | Fixed circular list — overwrites oldest when full |
| **Rate Limiting** | Cap on requests per user per time window |
| **TTL** | Time To Live — how long cached data stays valid |
| **Vite** | Build tool that compiles + minifies frontend code |
| **Weighted Average** | Average where some values count more than others |
| **Wind Chill** | Formula: wind makes temp feel colder |

---

*SkyGlass — See beyond the forecast. Built by Saptarshi Sadhu. 🌤️*
