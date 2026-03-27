# 🌤️ SkyGlass Weather System — Complete Beginner's Guide

> This document explains **everything** about the SkyGlass project from scratch.
> No prior experience is assumed. By the end, you will understand what every single file does,
> why it exists, how the code talks to the internet, and how all the pieces fit together.

---

## 🔗 Project Links

| What | Link |
|---|---|
| 📦 Source Code (GitHub) | [github.com/SAPTARSHI-coder/Weather-App](https://github.com/SAPTARSHI-coder/Weather-App) |
| 🟣 Live App (Render — Full Stack) | [weather-app-bfqr.onrender.com](https://weather-app-bfqr.onrender.com) |
| ⚫ Live App (Vercel — Frontend) | [weather-app-by-saptarshi-sadhu.vercel.app](https://weather-app-by-saptarshi-sadhu.vercel.app/) |

---

## 🧭 Table of Contents

1. [What is SkyGlass?](#1-what-is-skyglass)
2. [The Big Picture — How It All Works](#2-the-big-picture--how-it-all-works)
3. [What is a Frontend vs. Backend?](#3-what-is-a-frontend-vs-backend)
4. [Why Do We Need a Backend At All?](#4-why-do-we-need-a-backend-at-all)
5. [What Is An API?](#5-what-is-an-api)
6. [Full File Directory Explained](#6-full-file-directory-explained)
7. [The Intelligence Engines — Deep Dive](#7-the-intelligence-engines--deep-dive)
8. [How The Data Flows Step By Step](#8-how-the-data-flows-step-by-step)
9. [Key Concepts Glossary](#9-key-concepts-glossary)
10. [🧩 Design Decisions](#10--design-decisions)

---

## 1. What is SkyGlass?

SkyGlass is a **weather dashboard** — but a very advanced one.

Most weather apps (like the one on your phone) just fetch data from **one** weather service and show it to you. SkyGlass does much more:

- It asks **two completely different weather services** for data at the same time.
- It **compares** their answers and intelligently **merges** them into one reliable result.
- It runs the merged data through **12 custom analysis engines** (small programs that each do one smart thing — like predict rain, or detect dangerous conditions).
- Finally, it shows a **beautiful, animated dashboard** in your browser.

Think of it like a doctor who gets a second opinion, then runs lab tests before giving you a diagnosis — instead of just guessing from a quick look.

---

## 2. The Big Picture — How It All Works

Here is everything happening when you open SkyGlass and search for a city:

```
YOUR BROWSER
    │
    │  1. You type "Mumbai" and press Search
    │
    ▼
FRONTEND (index.html + script.js)
    │
    │  2. Sends a request: "Hey server, get me weather for Mumbai"
    │     (This is an HTTP GET request to /api/weather)
    │
    ▼
BACKEND SERVER (server.js running on Node.js)
    │
    ├── 3a. Asks WeatherAPI.com → gets current weather + forecast + air quality
    ├── 3b. Asks Open-Meteo.com → gets hourly data + 7-day extended forecast
    │
    │  4. Normalizes both answers into one common format
    │  5. Fuses them together using weighted math
    │  6. Runs 12 intelligence engines on the data
    │  7. Builds a final clean JSON response
    │
    │  8. Sends the final answer back to the browser
    │
    ▼
FRONTEND (script.js)
    │
    │  9. Reads the JSON and updates the dashboard cards, charts, and map
    │
    ▼
YOU SEE THE WEATHER DASHBOARD
```

---

## 3. What is a Frontend vs. Backend?

| | Frontend | Backend |
|---|---|---|
| **Where it runs** | In your browser (Chrome, Firefox, Safari) | On a server (a computer running 24/7) |
| **What it does** | Shows the user interface | Fetches and processes data |
| **Languages used** | HTML, CSS, JavaScript | JavaScript (Node.js) |
| **Files in this project** | `index.html`, `style.css`, `script.js`, `mapUtils.js` | `server.js`, all files in `src/weatherEngine/` |
| **Can it hold secrets?** | ❌ No — anyone can inspect browser code | ✅ Yes — server code is never seen by users |

In SkyGlass, the **frontend is the face** and the **backend is the brain**.

---

## 4. Why Do We Need a Backend At All?

This is a very important question. Here is why:

### The API Key Problem

To get weather data from WeatherAPI.com, you need a **secret password** called an **API Key**. It looks like this:

```
a1b2c3d4e5f6g7h8i9j0...
```

If you put this key directly in your browser's JavaScript code, **anyone** could open your website, press F12 (DevTools), read the key, and use it themselves without your permission. You'd run out of your free quota in hours.

**The solution:** Put the API key only on the server. The browser never sees it.

```
Browser → asks server → server uses the secret key → fetches from WeatherAPI → sends result back to browser
```

The browser only ever talks to YOUR server. The API key stays safe.

### The `.env` File

The API key is stored in a file called `.env` in the project root:

```
WEATHER_API_KEY=your_secret_key_here
```

This file is listed in `.gitignore`, which means it is **never uploaded to GitHub**. When deployed to Render, the key is entered directly into Render's dashboard — not in the code.

---

## 5. What Is An API?

**API** stands for **Application Programming Interface**. It sounds fancy, but it is simply a way for two programs to talk to each other over the internet.

Imagine going to a restaurant:
- You (the browser) are the customer.
- The waiter is the API.
- The kitchen (WeatherAPI.com) prepares the food (data).

You don't go into the kitchen yourself. You tell the waiter what you want (`GET weather for Mumbai`), and the waiter brings back your order (a JSON response).

In SkyGlass, we use two weather APIs:

| API | Free? | What We Get |
|---|---|---|
| **WeatherAPI.com** | Free tier available (key required) | Current conditions, 3-day forecast, AQI, historical data, city search |
| **Open-Meteo.com** | Completely free, no key needed | 7-day forecast, hourly data |

---

## 6. Full File Directory Explained

### 🖥️ Frontend Files (what runs in your browser)

---

#### `index.html` — The Skeleton of the App

**What it does:** This is the HTML file that defines the structure of everything you see on screen — the search bar, the weather cards, the forecast section, the map, the charts, and all the modals (pop-up panels).

**Think of it like:** A blueprint of a house. It says "put a window here, a door there" — but CSS decides what color they are, and JavaScript decides if they open and close.

**Why we need it:** The browser needs HTML to know *what* to display. Without HTML, the browser would show a blank page.

---

#### `style.css` — The Visual Design

**What it does:** Contains all the styling rules — colors, fonts, spacing, animations, the "glass" effect (called **glassmorphism** — making elements look like frosted glass), responsive grid layout, hover effects, and loading animations.

**Key design concepts used:**
- **CSS Variables** (e.g., `--primary-color`) — lets you change the whole theme by editing one line
- **Flexbox and Grid** — modern layout systems for arranging cards in rows and columns
- **Backdrop-filter: blur()** — the frosted glass visual effect
- **@keyframes** — CSS animations that make elements fade in, pulse, or slide

**Why we need it:** Without CSS, the app would be plain black text on a white background. CSS is what makes SkyGlass look premium.

---

#### `script.js` — The Frontend Brain (most important file)

**What it does:** This is the largest and most complex frontend file. It is responsible for:

1. **Detecting your location** — Uses the browser's built-in `navigator.geolocation` API to get your GPS coordinates (with your permission).
2. **Listening to user actions** — Watches for when you click the Search button, press Enter, or click a city suggestion.
3. **Fetching data from the backend** — Uses the browser's built-in `fetch()` function to send HTTP requests to `/api/weather`.
4. **Parsing the response** — Reads the JSON data the server sends back.
5. **Updating the UI** — Takes specific values from the data and writes them into the HTML (e.g., sets the temperature card to show `24°C`).
6. **Drawing Charts** — Uses the Chart.js library to draw bar graphs and line charts for the history section.
7. **Adding interactivity** — Things like toggling Celsius/Fahrenheit, opening the history modal, switching between tabs.

**Why we need it:** Without JavaScript, the page would be a static picture. It wouldn't react to anything you do. JavaScript makes the app *alive*.

---

#### `mapUtils.js` — The Interactive Map

**What it does:** Handles the Leaflet.js map integration. Specifically:
- Initializes the map centered on the world
- Loads weather tile layers (a visual overlay showing clouds and precipitation from a third-party tile server)
- Handles clicks on the map so that clicking any location automatically searches for weather there

**Why we need it:** Keeping map logic separate from `script.js` makes the code cleaner and easier to maintain. If the map breaks, you know exactly which file to look in.

---

#### `storageUtils.js` — Remembering User Preferences

**What it does:** A small helper file that wraps the browser's `localStorage` API (a way to save data in the browser that persists even after you close the tab). Used to save things like:
- The last searched city
- Whether the user prefers Celsius or Fahrenheit
- Clock timezone preferences

**Why we need it:** Without this, every time you refresh the page, the app would forget everything.

---

#### `prepend.js` — Build-Time Utility

**What it does:** A small script run as part of the Vite build process. It handles tasks like injecting metadata or modifying the HTML before it's compiled into the final `dist/` folder.

**Why we need it:** Allows custom pre-processing steps during the production build.

---

### ⚙️ Backend Files

---

#### `server.js` — The Backend Server (most important backend file)

**What it does:** This is the heart of the backend. It does the following:

**1. Sets up an Express web server**
```js
const app = express();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```
This makes the computer start "listening" for incoming requests from the browser.

**2. Defines API endpoints (routes)**
- `GET /api/weather` — the main endpoint that fetches and processes weather data
- `GET /api/history` — fetches historical weather for a past date
- `GET /api/search` — autocomplete city search

**3. Manages the in-memory cache**
A simple Map (dictionary) that saves the last response for each city. If the same city is requested again within 5 minutes, the server returns the saved answer instantly without making new API calls. This is called **caching** and it makes the app faster and uses fewer API quota.

**4. Runs the 8-step intelligence pipeline**
When a weather request comes in, the server runs through a series of calculations — fusing data, calculating RealFeel temperature, scoring rain probability, etc. — before assembling the final response.

**5. Keeps API keys safe**
The WeatherAPI key is read from the `.env` file using the `dotenv` library, and is used only inside this server file. It is never sent to the browser.

---

#### `vite.config.js` — Build Tool Configuration

**What it does:** Configures **Vite**, the tool that compiles and bundles the frontend code (HTML, CSS, JS) into optimized files ready for production. The `dist/` folder it produces is what gets served to users when they visit the live website.

**Why we need it:** The raw `index.html` and `script.js` files import libraries from `node_modules`. Vite packages everything into compact, browser-compatible files.

---

#### `package.json` — Project Manifest

**What it does:** Declares the project's identity and its dependencies (the external libraries it needs). Also defines the **npm scripts**:

| Script | Command | What it does |
|---|---|---|
| `dev` | `node server.js & vite` | Starts both the backend server AND the Vite development server at the same time |
| `build` | `vite build` | Compiles frontend into the `dist/` folder for production |
| `start:server` | `node server.js` | Starts only the backend server (used in production on Render) |

When someone new downloads this project, they just run `npm install` and everything listed in `package.json` gets installed automatically.

---

#### `.env` — Secret Configuration

**What it does:** Stores secret values that should never be committed to version control:
```
WEATHER_API_KEY=abc123yourkey
PORT=3001
```
The `dotenv` library reads this file at startup and makes the values available as `process.env.WEATHER_API_KEY`.

**⚠️ This file is in `.gitignore` and must NEVER be uploaded to GitHub.**

---

### 🧠 The Intelligence Engines (`src/weatherEngine/`)

These 12 files are what make SkyGlass genuinely intelligent. Each is a standalone JavaScript module that does one specific job. They are all called by `server.js` as part of the data processing pipeline.

---

## 7. The Intelligence Engines — Deep Dive

### `normalizer.js` — Speaking a Common Language

**The problem it solves:**  
WeatherAPI returns temperature as `current.temp_c`, while Open-Meteo returns it as `current_weather.temperature`. They use different field names, different units, and different structures. If the rest of the code had to handle both formats, it would become a nightmare.

**What it does:**  
Converts both API responses into a single, identical structure called a **canonical snapshot**:
```js
{
  source: "WeatherAPI",
  temp: 24.5,         // always Celsius
  humidity: 68,       // always percentage
  wind_kph: 14.4,     // always km/h
  cloud: 40,          // always percentage
  city: "Mumbai",
  ...
}
```
Now the rest of the code always knows exactly what fields to expect.

---

### `fusionEngine.js` — Combining Two Opinions Into One Truth

**The problem it solves:**  
WeatherAPI says the temperature in Mumbai is 25°C. Open-Meteo says it's 23°C. Which one is right? How do we decide?

**What it does:**  
Uses **weighted averaging** — a mathematical technique where you trust one source more than the other but still benefit from both:

```
Final temp = (WeatherAPI_temp × 0.60) + (OpenMeteo_temp × 0.40)
           = (25 × 0.60) + (23 × 0.40)
           = 15 + 9.2
           = 24.2°C
```

WeatherAPI is given 60% of the weight because it's more detailed and has AQI data. Open-Meteo gets 40% weight.

It also performs **outlier removal** — if the two sources disagree by more than 5°C, it assumes one has bad data and ignores the secondary source entirely.

---

### `conditionEngine.js` — What's The Weather Like, Really?

**The problem it solves:**  
WeatherAPI might say "Mist" and Open-Meteo might say "Foggy" for the same condition. Different APIs use completely different text labels. We need one consistent set of labels.

**What it does:**  
Takes the fused data (humidity, visibility, cloud cover, precipitation, etc.) and applies a set of logical rules to derive a clean, consistent condition label like `"Partly Cloudy"`, `"Heavy Rain"`, or `"Thunderstorm"` — along with a matching emoji and icon name.

---

### `realFeelEngine.js` — What Does It ACTUALLY Feel Like?

**The problem it solves:**  
28°C in dry desert air feels very different from 28°C in humid coastal air. Raw temperature alone is not enough.

**What it does:**  
Calculates the **perceived temperature** (like AccuWeather's RealFeel™) by combining:
- The actual air temperature
- **Wind Chill** — wind makes you feel colder by taking away body heat faster
- **Heat Index** — humidity makes you feel hotter because sweat doesn't evaporate
- **UV adjustment** — direct sunlight adds to perceived heat

The result is a single temperature number that matches how your body actually experiences the weather.

---

### `aqiHandler.js` — Air Quality Intelligence

**The problem it solves:**  
Raw air quality data from WeatherAPI includes separate readings for multiple pollutants (CO, NO₂, O₃, PM2.5, etc.) in different units. This needs to be converted into one simple score a person can understand.

**What it does:**
1. **Resolves** multiple pollutant readings into a single **AQI (Air Quality Index)** number (0–500)
2. **Categorizes** the AQI — Good (0–50), Moderate (51–100), Unhealthy (101+), etc.
3. **Generates a health tip** — e.g., "Sensitive groups should avoid outdoor activities"

---

### `confidenceCalc.js` — How Much Should We Trust This Data?

**The problem it solves:**  
Sometimes Open-Meteo is unavailable, or the two sources wildly disagree. The user deserves to know if the displayed data is highly reliable or just a best guess.

**What it does:**  
Scores the data confidence from `High` to `Low` based on:
- How many sources contributed data (1 source = lower confidence)
- How much the sources disagreed (large temp difference = lower confidence)

The dashboard shows a colored confidence badge so users always know data quality.

---

### `trendEngine.js` — Memory and Direction

**The problem it solves:**  
To know if the temperature is rising or falling, you need to remember what it was an hour ago and two hours ago — not just right now.

**What it does:**  
Maintains a **ring buffer** (a fixed-size list that overwrites old entries) for each city. Every time a weather request is made for a city, the new values are added to the buffer. Then it applies **linear regression** (a math formula) to calculate the slope of the temperature, humidity, pressure, and AQI over time.

A **positive slope** = rising. A **negative slope** = falling. A slope near **zero** = stable.

This is what powers the "↑ Rising", "↓ Falling", "→ Stable" indicators in the dashboard.

---

### `predictionEngine.js` — What Will Happen Next Hour?

**The problem it solves:**  
Users want to plan ahead. Knowing the current temperature is useful, but knowing if it'll be warmer or cooler in an hour is more useful.

**What it does:**  
Uses the trend slopes from the Trend Engine to **extrapolate one hour into the future**:

```
predicted_temp = current_temp + (temp_slope × 1 hour)
```

It also adjusts for time-of-day (temperatures typically peak at 2–3 PM and drop at night) and uses the current condition to predict the future condition.

The result: "It will be 26°C in one hour, with Partly Cloudy skies."

---

### `rainEngine.js` — Will It Rain?

**The problem it solves:**  
A simple "rain: yes/no" is not very helpful. Users want a probability — "40% chance of rain" — so they can decide whether to carry an umbrella.

**What it does:**  
Calculates a rain probability score (0–100%) by combining five factors:

| Factor | Logic |
|---|---|
| **Humidity** | Above 80% adds significant rain score |
| **Pressure Trend** | Falling pressure signals approaching storms |
| **Cloud Cover** | High cloud cover increases rain chance |
| **Visibility** | Low visibility suggests precipitation already starting |
| **Precipitation** | Current rainfall is the strongest indicator |

Each factor adds to a cumulative score, which is then clamped between 0 and 100.

---

### `anomalyEngine.js` — Is Something Dangerous Happening?

**The problem it solves:**  
Extreme weather can be life-threatening. A user checking the weather casually needs to be immediately warned if conditions are abnormal or hazardous.

**What it does:**  
Scans the fused data for statistical outliers and flags them as **anomalies**:

| Condition | Threshold | Alert |
|---|---|---|
| Extreme Heat | Temp > 45°C | 🔴 Extreme Heat Warning |
| Extreme Cold | Temp < -20°C | 🔴 Extreme Cold Warning |
| Pressure Crash | Pressure drop > 5 mb/hr | 🟠 Rapid Pressure Drop |
| Dangerous AQI | AQI > 200 | 🔴 Very Unhealthy Air |
| Near-Zero Visibility | Visibility < 0.5 km | 🟠 Dangerous Fog |
| Hurricane Winds | Wind > 120 km/h | 🔴 Hurricane-Force Wind |

If anomalies are detected, a warning banner appears on the dashboard.

---

### `stabilityEngine.js` — Is The Atmosphere Calm or Chaotic?

**The problem it solves:**  
Knowing that it's cloudy right now is one thing. Knowing that conditions have been erratic and changing for the past few hours is another — that tells you a storm may be building.

**What it does:**  
Analyzes the ring buffer of past temperature readings to calculate **variance** (how much the values are jumping around). Based on the variance, it classifies the atmosphere as:

- **Stable** — temperatures have been consistent, conditions unlikely to change abruptly
- **Unsettled** — some variability, expect changes
- **Volatile** — large fluctuations detected, conditions may shift dramatically

---

### `insightEngine.js` — Talking To You Like a Human

**The problem it solves:**  
All the computed metrics (rain probability: 72%, stability: Volatile, AQI: 145) are useful for developers but confusing to regular users. People understand human language, not numbers.

**What it does:**  
Takes all the computed values and translates them into prioritized, natural-language sentences:

```
"Thunderstorms possible within the next few hours — stay indoors."
"Air quality is unhealthy. Consider wearing a mask outdoors."
"UV index is extreme — avoid prolonged sun exposure before 4 PM."
"Visibility is critically low. Exercise caution if driving."
```

It checks all conditions, prioritizes the most critical ones, and returns a ranked list of 2–5 insights for the dashboard's insight panel.

---

## 8. How The Data Flows Step By Step

Here is a complete, granular walkthrough of what happens from the moment you search for a city:

**Step 1 — User Action**  
You type "London" in the search box and press Enter. `script.js` intercepts the keyboard event, reads the city name, and calls the internal `fetchWeather()` function.

**Step 2 — Frontend Request**  
`fetchWeather()` uses the browser's `fetch()` API to send an HTTP GET request to the backend:
```
GET http://localhost:3001/api/weather?q=London
```
A loading spinner appears on screen while waiting.

**Step 3 — Server Cache Check**  
`server.js` receives the request. It checks its in-memory cache map for the key `fused:london`. If found and less than 5 minutes old → returns the cached data immediately (very fast). If not found → continues.

**Step 4 — WeatherAPI Fetch**  
The server calls WeatherAPI.com with the secret API key:
```
GET https://api.weatherapi.com/v1/forecast.json?key=SECRET&q=London&days=3&aqi=yes
```
This returns current conditions, 3-day forecast, and air quality data.

**Step 5 — Open-Meteo Fetch (in parallel)**  
Simultaneously, the server extracts the GPS coordinates (lat/lon) from the WeatherAPI response and calls Open-Meteo:
```
GET https://api.open-meteo.com/v1/forecast?latitude=51.52&longitude=-0.11&...
```
This returns hourly data and a 7-day forecast. No API key needed.

**Step 6 — Normalization**  
`normalizer.js` converts both raw responses into identical canonical snapshot objects.

**Step 7 — Fusion**  
`fusionEngine.js` merges the two snapshots using weighted averaging. Outliers are removed. A single `fused` object is produced.

**Step 8 — Intelligence Pipeline (all run in sequence)**  
The fused object is passed through all 12 engines. Each engine reads it, computes something, and adds new fields to the growing response object. After all engines run, the response object contains ~40 fields.

**Step 9 — Response Assembly & Cache**  
The server assembles the final JSON response object, stores it in the cache, and sends it to the browser with HTTP status 200.

**Step 10 — Frontend Rendering**  
`script.js` receives the JSON, and methodically updates every element on the page — temperature cards, wind details, AQI badge, forecast strips, the insights panel, the prediction box — by directly setting their `textContent` or `innerHTML`.

**Step 11 — Charts & Map**  
For the history section, `script.js` makes additional calls to `/api/history` (one per day, for up to 14 days) and uses Chart.js to draw graphs. The Leaflet map in `mapUtils.js` is also updated to center on the searched city.

---

## 9. Key Concepts Glossary

| Term | Simple Definition |
|---|---|
| **API** | A way for two programs to talk to each other over the internet |
| **API Key** | A secret password that grants you access to a paid or rate-limited service |
| **Backend** | Code that runs on a server (not in the browser). Handles data, security, logic |
| **Caching** | Saving a result so you can return it instantly next time instead of recomputing it |
| **Canonical Schema** | One standardized data format that everything agrees to use |
| **DOM** | The HTML structure of a web page that JavaScript can read and modify |
| **dotenv** | A library that loads secret values from a `.env` file into `process.env` |
| **ES Module** | A modern JavaScript file that uses `import`/`export` to share code between files |
| **Express** | A Node.js library that makes it easy to create web servers and define URL routes |
| **Frontend** | Code that runs in the browser — the user interface |
| **Glassmorphism** | A UI design style where elements look like frosted glass (blurred background, slight transparency) |
| **HTTP GET** | A type of web request that says "give me data from this URL" |
| **JSON** | JavaScript Object Notation — a simple text format for exchanging data between programs |
| **Linear Regression** | A math formula that finds the best straight line through a set of data points — used to calculate trends |
| **Node.js** | A runtime that lets JavaScript code run outside the browser (i.e., on a server) |
| **npm** | Node Package Manager — the tool used to install JavaScript libraries |
| **Ring Buffer** | A fixed-size list that automatically overwrites the oldest entry when full — used for the trend history |
| **TTL Cache** | A cache where entries expire (get deleted) after a set time ("Time To Live") |
| **Vite** | A build tool that compiles frontend code into optimized files ready for production |
| **Weighted Average** | An average where some values count more than others |
| **`.gitignore`** | A file that tells Git which files to never upload to GitHub (e.g., `.env`, `node_modules`) |

---

## 10. 🧩 Design Decisions

> These are the **"why"** answers — the reasoning behind every major architectural choice in SkyGlass.
> These are exactly the questions a senior engineer or interviewer will ask.

---

### ❓ Why use TWO weather APIs instead of one?

**The short answer:** No single weather API is 100% accurate everywhere on Earth.

**The full reasoning:**  
WeatherAPI.com is excellent for current conditions and AQI, but its free tier only covers a 3-day forecast. Open-Meteo provides a free, unlimited 7-day forecast but lacks air quality data. By combining both:

- We get **deeper forecast coverage** (7 days instead of 3)
- We get **cross-validation** — if both APIs agree on 24°C, we're confident. If they disagree by 6°C, we know something is off and can handle it gracefully
- If one API goes down, the other acts as a **fallback** — the app still works

Using a single source would be simpler to build, but it would make the app brittle and less accurate. The complexity is a deliberate tradeoff for reliability.

---

### ❓ Why build a backend server at all? Why not just call APIs from the browser?

**The short answer:** Security, control, and power.

**The full reasoning:**  
Calling external APIs directly from browser JavaScript (called a "client-side fetch") has three critical problems:

1. **API Key Exposure** — Any key placed in browser JavaScript can be read by anyone who opens DevTools (F12). Someone could steal the key, exhaust its quota, or rack up charges.
2. **CORS Restrictions** — Many APIs block direct browser requests from other domains for security reasons. A server-side request doesn't have this limitation.
3. **No Processing Power** — Running 12 analysis engines, maintaining a trend buffer, and fusing data from two sources in the browser would be slow and expose all business logic to the public.

The backend acts as a **secure, intelligent middleman** — it holds the secrets, does the heavy computation, and only sends the final clean result to the browser.

---

### ❓ Why implement caching? Isn't it just extra complexity?

**The short answer:** Speed, cost control, and API quota protection.

**The full reasoning:**  
Every call to `/api/weather` triggers two external HTTP requests (WeatherAPI + Open-Meteo). Each of those takes 300–800ms and counts against rate limits.

If 20 users search for "Mumbai" within 5 minutes, without caching that's 40 external API calls. With caching, it's 2 calls — the first request fetches and stores it, the next 19 get the saved answer instantly.

Benefits:
- **Response time drops** from ~700ms to ~2ms for cached hits
- **API quota is preserved** — free tier limits aren't wasted on duplicate requests
- **User experience improves** — repeat searches feel instantaneous

The TTL (Time To Live) is set to 5 minutes because weather data doesn't change meaningfully faster than that.

---

### ❓ Why weighted fusion instead of just averaging the two APIs equally?

**The short answer:** Not all data sources are equally reliable for every metric.

**The full reasoning:**  
A naive 50/50 average assumes both sources are equally trustworthy. They are not:

| Metric | WeatherAPI weight | Open-Meteo weight | Reason |
|---|---|---|---|
| Temperature | 60% | 40% | Both are reliable; WeatherAPI has slightly more granular station data |
| Wind speed | 70% | 30% | WeatherAPI uses more local stations |
| Humidity | 100% | 0% | Open-Meteo's hourly humidity is less accurate for current conditions |
| Cloud cover | 50% | 50% | Both are equally strong satellite-derived |

Weighted fusion means: **"Trust the expert more, but don't ignore the second opinion entirely."**

The outlier threshold (5°C) is an additional safeguard — if the two sources disagree wildly, the secondary source is discarded entirely rather than dragging the result toward a wrong answer.

---

### ❓ Why use a ring buffer for the trend engine instead of an array that keeps growing?

**The short answer:** Memory efficiency and relevance — old data stops mattering.

**The full reasoning:**  
If a user keeps the app open for 12 hours and we store every reading in an ever-growing array, memory usage climbs indefinitely. More importantly, a temperature reading from 10 hours ago is irrelevant to what will happen in the next hour.

A **ring buffer** fixes both problems:
- It has a **fixed maximum size** (e.g., 12 entries), so memory is always bounded
- When it's full, the **oldest entry is automatically overwritten** by the newest one
- The trend calculation always operates on the most **recent, relevant** data window

This is the same technique used in real-time signal processing, audio engineering, and embedded systems — wherever you need a sliding window of recent history.

---

### ❓ Why split the intelligence logic into 12 separate engine files instead of writing it all in `server.js`?

**The short answer:** Separation of concerns — each engine can be understood, tested, and changed independently.

**The full reasoning:**  
Imagine if all 12 engines were one massive 1,500-line function in `server.js`. When the rain probability formula needed updating, you'd have to search through thousands of lines of unrelated code to find it. A bug in one calculation could silently break another.

By giving each engine its own file with a single exported function:
- **Readability** — `rainEngine.js` contains only rain-related logic. Anyone can open it and immediately understand its purpose.
- **Testability** — You can write unit tests for `calcRainProbability()` in complete isolation
- **Replaceability** — Want to upgrade the prediction algorithm? Replace `predictionEngine.js` without touching anything else
- **Debugging** — When something breaks, the error trace points to a specific engine file, not a 1,500-line monolith

This is the **Single Responsibility Principle** — one of the foundational principles of professional software engineering.

---

### ❓ Why use Vite as the build tool instead of just serving the raw HTML/JS files?

**The short answer:** Raw files work in development but are too slow and too large for production.

**The full reasoning:**  
The project uses several JavaScript libraries (Chart.js, Leaflet, etc.) imported from `node_modules`. If you served the raw files directly:
- The browser would make dozens of separate HTTP requests to load each module
- The JavaScript would be unminified (full comments, whitespace, long variable names) — much larger file sizes
- There would be no cache-busting (browsers might serve stale old files after updates)

Vite solves all of this:
- **Bundles** all JS into one (or a few) optimized files — fewer HTTP requests
- **Minifies** code — smaller files, faster download
- **Hashes file names** — e.g., `script.a3f9c2.js` — so browsers always load the latest version
- **Tree-shakes** unused code — only the parts of Chart.js actually used end up in the bundle

In production, the `dist/` folder Vite produces is entirely self-contained and can be served by any static file host.

---

### ❓ Why deploy on both Render AND Vercel?

**The short answer:** They serve different purposes, and having both demonstrates understanding of deployment strategies.

**The full reasoning:**  

| | Render | Vercel |
|---|---|---|
| **Type** | Full-stack (Node.js server) | Static frontend only |
| **Backend runs?** | ✅ Yes | ❌ No |
| **Best for** | The complete, production experience | Fast, global CDN delivery of the UI |
| **Free tier sleep?** | Yes (spins up on first request) | No (always fast) |

Render hosts the full application — the Express server runs there and handles all API calls, caching, and intelligence processing. This is the **recommended link** for anyone who wants to see SkyGlass working fully.

Vercel hosts only the compiled `dist/` folder as a static site — it's blazing fast because it's served from edge servers worldwide. It's useful for demonstrating the frontend in isolation, or as a fallback if the Render service is sleeping.

Deploying in both places also demonstrates a real-world skill: understanding the difference between **static hosting** and **compute hosting**, and knowing when to use each.

---

*This guide was written so that any beginner, regardless of background, can fully understand how SkyGlass is built and why every design decision was made. — Saptarshi Sadhu*
