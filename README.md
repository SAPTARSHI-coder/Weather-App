# 🌤️ SkyGlass — Multi-Source Environmental Intelligence System

> A production-grade, full-stack weather platform that fuses data from multiple live APIs, applies a custom intelligence layer, and delivers a premium glassmorphism UI with real-time environmental insights.

[![GitHub](https://img.shields.io/badge/GitHub-SAPTARSHI--coder%2FWeather--App-181717?style=for-the-badge&logo=github)](https://github.com/SAPTARSHI-coder/Weather-App)
[![Render](https://img.shields.io/badge/Render-Live%20Demo-4f46e5?style=for-the-badge&logo=render)](https://weather-app-bfqr.onrender.com)
[![Vercel](https://img.shields.io/badge/Vercel-Live%20Demo-000000?style=for-the-badge&logo=vercel)](https://weather-app-by-saptarshi-sadhu.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express)](https://expressjs.com)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet)](https://leafletjs.com)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384?style=for-the-badge&logo=chartdotjs)](https://www.chartjs.org)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Intelligence Engines](#-intelligence-engines)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [How Data Flows](#-how-data-flows)
- [License](#-license)

---

## 🌐 Overview

SkyGlass is not a typical weather widget. It is a **multi-source environmental intelligence system** built from scratch with a decoupled frontend/backend architecture. Instead of blindly trusting a single weather provider, SkyGlass simultaneously queries **WeatherAPI** and **Open-Meteo**, fuses the results through a custom normalization engine, applies an eight-step intelligence pipeline, and finally serves a clean, unified JSON response to the frontend.

The result is a dashboard that provides not only current conditions but also:
- **Next-hour predictions** via trend extrapolation
- **Rain probability scoring** from atmospheric composites
- **Anomaly detection** for extreme or dangerous conditions
- **Atmospheric stability classification**
- **AQI health guidance** with real-time air quality data
- **7-day blended forecast** combining both data sources
- **14-day historical view** with interactive charts

---

## 🚀 Live Demo

| Platform | URL | Notes |
|---|---|---|
| 🟣 **Render** | [weather-app-bfqr.onrender.com](https://weather-app-bfqr.onrender.com) | Full-stack Node.js service (backend + frontend served together) |
| ⚫ **Vercel** | [weather-app-by-saptarshi-sadhu.vercel.app](https://weather-app-by-saptarshi-sadhu.vercel.app/) | Frontend-only static deployment |
| 🐙 **Source Code** | [github.com/SAPTARSHI-coder/Weather-App](https://github.com/SAPTARSHI-coder/Weather-App) | Full source — open for contributions |

> **Recommended:** Use the Vercel link for the full experience, as it runs the complete backend and frontend intelligence pipeline.

---

## ✨ Key Features

| Feature | Details |
|---|---|
| 🔀 **Data Fusion** | Blends WeatherAPI (primary) + Open-Meteo (secondary) into a single canonical snapshot |
| 🧠 **Prediction Engine** | Extrapolates next-hour temperature & condition from historical trend slopes |
| 🌧️ **Rain Scoring** | Multi-factor rain probability: humidity, cloud cover, pressure trend, visibility, precipitation |
| ⚡ **Anomaly Detection** | Flags statistically extreme events (heatwaves, pressure crashes, zero visibility) |
| 🌿 **AQI Intelligence** | Real-time Air Quality Index with health tips and color-coded risk categories |
| 🌡️ **RealFeel® Temperature** | AccuWeather-style perceived temperature accounting for wind, humidity, and UV |
| 📈 **Trend Engine** | Per-city in-memory ring buffer tracking temperature, humidity, pressure, AQI slopes |
| 🗺️ **Interactive Map** | Leaflet.js map with toggleable RainViewer (Precipitation Radar) and OpenWeatherMap (Satellite Clouds) overlays |
| 📅 **History Dashboard** | 14-day lookback with Chart.js visualizations (temperature, humidity, pressure, AQI) |
| ⏱️ **Dual Timezone Clock** | Live clock widget showing local time and a second configurable timezone |
| 💨 **Atmosphere Monitor** | Dedicated pressure, UV, and CO monitoring cards |
| 🔒 **Secure Key Management** | API keys never touch the browser — all external requests route through the backend |
| ⚡ **5-min Response Cache** | In-memory TTL cache on the server reduces redundant API calls |
| 🔁 **Retry + Timeout Logic** | `fetchWithRetry()` wrapper with configurable retries and axios timeouts |
| 📱 **Responsive Design** | Mobile-first glassmorphism UI with smooth CSS animations and micro-interactions |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Frontend)                           │
│  index.html  ·  style.css  ·  script.js  ·  mapUtils.js            │
│  Leaflet.js (Map)  ·  Chart.js (Graphs)                             │
└─────────────────────────┬───────────────────────────────────────────┘
                          │  HTTP GET /api/weather?lat=&lon=
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Express Server (server.js)                    │
│                                                                     │
│   ┌──────────────┐    ┌──────────────────────────────────────────┐  │
│   │  In-Memory   │    │         8-Step Intelligence Pipeline      │  │
│   │  TTL Cache   │    │  1. Normalize   5. RealFeel              │  │
│   │  (5 min TTL) │    │  2. Fuse        6. AQI                  │  │
│   └──────────────┘    │  3. Condition   7. Confidence           │  │
│                       │  4. Smoothing   8. Intelligence Layer   │  │
│                       └──────────────────────────────────────────┘  │
└────────┬──────────────────────────────────────────┬─────────────────┘
         │                                          │
         ▼                                          ▼
┌────────────────────┐                  ┌────────────────────────────┐
│   WeatherAPI.com   │                  │       Open-Meteo.com       │
│  (Current + 3-day  │                  │  (Hourly + 7-day forecast, │
│   forecast + AQI)  │                  │   free, no key required)   │
└────────────────────┘                  └────────────────────────────┘
```

---

## 🧠 Intelligence Engines

All engines live in `src/weatherEngine/`. Each is a standalone ES module with a single responsibility.

| Engine | File | Purpose |
|---|---|---|
| **Normalizer** | `normalizer.js` | Converts raw WeatherAPI and Open-Meteo responses into a shared canonical schema |
| **Fusion Engine** | `fusionEngine.js` | Merges two normalized snapshots using weighted averaging and tracks `sources_used` |
| **Condition Engine** | `conditionEngine.js` | Derives a semantic weather condition string and emoji from fused data; maps to icon |
| **RealFeel Engine** | `realFeelEngine.js` | Computes perceived temperature using wind chill, heat index, and UV adjustment formulas |
| **AQI Handler** | `aqiHandler.js` | Resolves raw air quality readings to a scalar AQI, categorizes it, and outputs health tips |
| **Confidence Calculator** | `confidenceCalc.js` | Scores data confidence (High/Medium/Low) based on source count and inter-source temp delta |
| **Trend Engine** | `trendEngine.js` | Maintains a per-city rolling ring buffer; computes linear regression slopes for temp, humidity, pressure, AQI |
| **Prediction Engine** | `predictionEngine.js` | Projects next-hour temp and condition from trend slopes and current state |
| **Rain Engine** | `rainEngine.js` | Calculates rain probability (0–100%) from humidity, pressure trend, cloud, visibility, and precip |
| **Anomaly Engine** | `anomalyEngine.js` | Detects statistical outliers (extreme heat/cold, pressure crashes, dangerous AQI, near-zero visibility) |
| **Stability Engine** | `stabilityEngine.js` | Classifies atmospheric stability (Stable / Unsettled / Volatile) using temp variance in the ring buffer |
| **Insight Engine** | `insightEngine.js` | Generates a prioritized list of natural-language environmental insight strings for the dashboard |

---

## 📂 Project Structure

```
skyglass-weather/
│
├── index.html              # Main SPA shell — all dashboard cards, modals, map container
├── style.css               # Global design system: glassmorphism, animations, responsive grid
├── script.js               # Frontend brain: event handling, API calls, DOM updates, charts
├── mapUtils.js             # Leaflet map initialization, weather tile overlay, click-to-search
├── storageUtils.js         # LocalStorage helpers for persisting user preferences
├── prepend.js              # Utility run before Vite build (meta injection, etc.)
│
├── server.js               # Express backend: API proxy, fusion pipeline, cache, endpoints
├── vite.config.js          # Vite build configuration
├── package.json            # Dependencies and npm scripts
├── .env                    # Secret environment variables (not committed)
├── .gitignore
│
├── src/
│   └── weatherEngine/      # 12 standalone intelligence engine modules
│       ├── normalizer.js
│       ├── fusionEngine.js
│       ├── conditionEngine.js
│       ├── realFeelEngine.js
│       ├── aqiHandler.js
│       ├── confidenceCalc.js
│       ├── trendEngine.js
│       ├── predictionEngine.js
│       ├── rainEngine.js
│       ├── anomalyEngine.js
│       ├── stabilityEngine.js
│       └── insightEngine.js
│
├── public/                 # Static assets (icons, images)
├── dist/                   # Production build output (generated by `npm run build`)
└── PROJECT_OVERVIEW.md     # Beginner-friendly architecture guide
```

---

## 🔌 API Endpoints

The Express backend exposes three REST endpoints:

### `GET /api/weather`
The primary fusion endpoint. Returns the full intelligence payload for a location.

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `lat` | `number` | Yes* | Latitude of the location |
| `lon` | `number` | Yes* | Longitude of the location |
| `q` | `string` | Yes* | City name or `lat,lon` string (alternative to lat/lon) |

*Either `lat`+`lon` or `q` must be provided.

**Response Fields (abbreviated):**

```json
{
  "success": true,
  "data": {
    "temp": 24,
    "feels_like": 26,
    "feels_like_desc": "Warm",
    "humidity": 68,
    "wind_kph": 14.4,
    "wind_dir": "SSW",
    "cloud": 40,
    "visibility": 10,
    "uv": 5,
    "is_day": 1,
    "precip_mm": 0,
    "pressure_mb": 1013,
    "condition": "Partly Cloudy",
    "condition_emoji": "⛅",
    "condition_icon": "cloud-sun",
    "aqi": 45,
    "aqi_category": "Good",
    "aqi_color": "#00c853",
    "aqi_emoji": "🟢",
    "aqi_tip": "Air quality is satisfactory.",
    "confidence": 90,
    "confidence_label": "High",
    "sources_used": ["WeatherAPI", "Open-Meteo"],
    "city": "Mumbai",
    "country": "India",
    "forecast7": [ /* 7-day blended forecast array */ ],
    "predicted_temp": 25,
    "predicted_condition": "Partly Cloudy",
    "temp_direction": "rising",
    "rain_probability": 32,
    "stability": "Stable",
    "anomalies": [],
    "anomaly_severity": "none",
    "insights": ["Moderate UV — wear sunscreen outdoors."],
    "trends": { "temp_trend": 0.3, "pressure_trend": -0.1 },
    "raw": { /* full WeatherAPI response */ }
  }
}
```

---

### `GET /api/history`
Fetches historical weather data for a specific date via WeatherAPI.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | `string` | Yes | City name or coordinates |
| `dt` | `string` | Yes | Date in `YYYY-MM-DD` format |

---

### `GET /api/search`
City autocomplete search powered by WeatherAPI's search endpoint.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | `string` | Yes | Partial city name to search |

---

## 🛠️ Tech Stack

**Backend**
| Package | Version | Role |
|---|---|---|
| `express` | ^5.2.1 | HTTP server framework |
| `axios` | ^1.13.2 | HTTP client for external API calls |
| `dotenv` | ^17.2.3 | Environment variable injection |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing middleware |

**Frontend**
| Library | Version | Role |
|---|---|---|
| `chart.js` | ^4.4.0 | Historical data visualizations |
| `chartjs-plugin-datalabels` | ^2.2.0 | Value labels on chart bars |
| `leaflet` | ^1.9.4 | Interactive map with weather tile overlays |

**Tooling**
| Tool | Version | Role |
|---|---|---|
| `vite` | ^6.0.0 | Frontend build tool and dev server |

**External APIs**
| API | Key Required | Usage |
|---|---|---|
| [WeatherAPI.com](https://www.weatherapi.com) | ✅ Yes | Current weather, 3-day forecast, AQI, search, history |
| [OpenWeatherMap](https://openweathermap.org/) | ✅ Yes | Satellite cloud cover tile overlays for the map |
| [Open-Meteo.com](https://open-meteo.com) | ❌ No | 7-day extended forecast, hourly data (free) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- A free **WeatherAPI** key from [weatherapi.com](https://www.weatherapi.com)

### 1. Clone the repository

```bash
git clone https://github.com/SAPTARSHI-coder/Weather-App.git
cd Weather-App
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
WEATHER_API_KEY=your_weatherapi_key_here
VITE_OWM_API_KEY=your_openweathermap_key_here
PORT=3001
```

### 4. Run in development mode

This starts both the Express backend and the Vite dev server concurrently:

```bash
npm run dev
```

- **Frontend (Vite):** `http://localhost:5173`
- **Backend (Express):** `http://localhost:3001`

### 5. Build for production

```bash
npm run build
```

Then start the production server (serves the built frontend as static files):

```bash
node server.js
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `WEATHER_API_KEY` | ✅ Yes | WeatherAPI.com API key for core data |
| `VITE_OWM_API_KEY` | ✅ Yes | OpenWeatherMap API key for map cloud tiles |
| `PORT` | No | Server port (defaults to `3001`) |

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`. API keys should be set as environment variables in your hosting dashboard (e.g., Render's Environment tab).

---

## ☁️ Deployment

SkyGlass is deployed on two platforms simultaneously:

### 🟣 Render (Full-Stack — Recommended)
**Live:** [https://weather-app-bfqr.onrender.com](https://weather-app-bfqr.onrender.com)

| Setting | Value |
|---|---|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Environment** | Node |
| **Port** | `10000` (Render default) or set via `PORT` env var |

Set the following in **Render → Your Service → Environment**:
```
WEATHER_API_KEY = your_weatherapi_key_here
VITE_OWM_API_KEY = your_openweathermap_key_here
```

The Express server in `server.js` is automatically configured to serve the built `dist/` folder as static files in production, so a single backend service handles both serving the frontend and running the backend API seamlessly.

---

### ⚫ Vercel (Frontend Static)
**Live:** [https://weather-app-by-saptarshi-sadhu.vercel.app](https://weather-app-by-saptarshi-sadhu.vercel.app/)

The Vercel deployment serves the pre-built `dist/` folder as a static site. It does **not** run the Node.js backend, so API calls must point to the Render backend URL.

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

---

## 🔄 How Data Flows

```
1. User searches for a city or grants geolocation
           │
           ▼
2. Frontend (script.js) sends GET /api/weather?lat=&lon= to the backend
           │
           ▼
3. Server checks the 5-minute in-memory TTL cache
   ├── HIT  → return cached response instantly
   └── MISS → continue pipeline
           │
           ▼
4. PARALLEL fetch:
   ├── WeatherAPI  → current + 3-day forecast + AQI
   └── Open-Meteo → hourly + 7-day forecast (via resolved coordinates)
           │
           ▼
5. Normalize both API responses into canonical weather snapshots
           │
           ▼
6. Fuse snapshots → weighted average of temp, humidity, wind, etc.
           │
           ▼
7. Intelligence pipeline (all computed server-side):
   ├── Condition Engine   → semantic label + emoji + icon
   ├── RealFeel Engine    → perceived temperature
   ├── Data Smoothing     → EMA smoothing to reduce noise
   ├── AQI Handler        → scalar AQI + category + health tip
   ├── Confidence Calc    → reliability score + reason
   ├── Trend Engine       → store snapshot; compute slopes
   ├── Prediction Engine  → next-hour temp + condition
   ├── Rain Engine        → multi-factor probability score
   ├── Anomaly Engine     → flag dangerous outliers
   ├── Stability Engine   → classify atmospheric turbulence
   └── Insight Engine     → generate human-readable alerts
           │
           ▼
8. Assemble final JSON, cache it, send to frontend
           │
           ▼
9. Frontend renders: cards, charts, map, forecast strips, insight panel
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  <strong>Built with ☁️ and precision by Saptarshi Sadhu</strong><br/>
  <em>SkyGlass — See beyond the forecast.</em>
</div>
