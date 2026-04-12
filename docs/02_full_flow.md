# 🎬 The Full Story — What Happens When You Search a City

> Think of this as a movie. The user is the hero. The system is working backstage.

---

## The Cast of Characters

| Character | Who They Are |
|---|---|
| **You** | You open SkyGlass in your browser |
| **index.html** | The stage — what you see on screen |
| **script.js** | Your personal assistant in the browser — listens, acts |
| **server.js** | The smart manager backstage — coordinates everything |
| **WeatherAPI.com** | Doctor #1 — detailed, experienced |
| **Open-Meteo.com** | Doctor #2 — free, gives longer-range opinions |
| **12 Engines** | The lab team — each runs one specialized test |

---

## 🎭 Act 1 — You Search for a City

You open the app. The browser asks your phone's GPS: *"Where is the user?"*

> **Analogy:** Imagine walking into a hospital and the receptionist says: "Before you even speak, let me check your address on file."

Your phone GPS replies: *"They're in Kolkata — 22.57° N, 88.36° E"*

The app records that. Now it's ready for your search.

You type **"Mumbai"** in the search box and press **Enter**.

`script.js` (your browser assistant) hears this. It immediately:
1. Shows a spinning loading circle (so you know it's working)
2. Packages your request as a message and sends it **to the server**

The message looks like this:
```
"Hey server, please get me weather data for Mumbai."
GET /api/weather?q=Mumbai
```

> **Analogy:** You've just called a travel agent. You said "Get me info about Mumbai." The agent (server) will now make all the calls on your behalf.

---

## 🎭 Act 2 — The Server Wakes Up

`server.js` receives your message.

**First thing it does:** Checks the *memory drawer* (cache).

> **Analogy:** The travel agent checks if a colleague already looked up Mumbai in the last 10 minutes. If yes — here's the exact same report, saved instantly. No need to call anyone again.

```
Cache Key: "fused:mumbai"
Result: Not found (or too old) → Proceed to fetch fresh data
```

If the cache has fresh data, it sends it back **immediately** — in 2 milliseconds instead of 700 milliseconds. This is called a **Cache Hit**.

If not — the server starts making calls.

---

## 🎭 Act 3 — Calling Two Weather Doctors

The server now contacts **two completely separate weather services at the same time** — like calling two doctors simultaneously for a second opinion.

### Doctor 1: WeatherAPI.com

The server sends a secret-key-protected request:
```
GET https://api.weatherapi.com/v1/forecast.json
    ?key=YOUR_SECRET_KEY
    &q=Mumbai
    &days=3
    &aqi=yes
```

Doctor 1 replies with:
- Current temperature, humidity, wind, cloud cover
- Air quality (AQI) data
- 3-day forecast with hourly breakdown
- Sunrise and sunset times

### Doctor 2: Open-Meteo.com (Free, No Key Needed)

Using Mumbai's GPS coordinates (from Doctor 1's reply), the server simultaneously calls:
```
GET https://api.open-meteo.com/v1/forecast
    ?latitude=19.07
    &longitude=72.87
    &hourly=temperature_2m,...
    &forecast_days=7
```

Doctor 2 replies with:
- 7-day extended forecast (days 4-7 that Doctor 1 doesn't give for free)
- Hourly temperature, humidity, cloud, visibility data

> **Analogy:** Doctor 1 gives you a 3-day hospital report. Doctor 2 gives you a 7-day home care plan. Together, you have a complete picture.

---

## 🎭 Act 4 — The Translator (Normalizer)

Here's a problem. Doctor 1 sends the temperature as:
```json
"current": { "temp_c": 32.4 }
```

Doctor 2 sends the temperature as:
```json
"current_weather": { "temperature": 31.1 }
```

They use different names for the same thing! The server would get confused trying to read both.

So `normalizer.js` translates **both** into one common language called a **Canonical Snapshot**:

```json
{
  "source": "WeatherAPI",
  "temp": 32.4,
  "humidity": 72,
  "wind_kph": 18.5,
  "cloud": 55,
  "city": "Mumbai"
}
```

Now both doctors are speaking the same language. The rest of the system doesn't even know which doctor the data came from.

> **Analogy:** Two doctors write their reports in different formats. A medical secretary re-types both into the hospital's standard template.

---

## 🎭 Act 5 — The Fusion (Blending Two Opinions)

Now the server has two normalized snapshots. Time to merge them.

`fusionEngine.js` uses **weighted math** to combine both:

```
Final Temperature = (WeatherAPI × 60%) + (Open-Meteo × 40%)
                  = (32.4 × 0.60) + (31.1 × 0.40)
                  = 19.44 + 12.44
                  = 31.88°C ≈ 32°C
```

If the two doctors **disagree by more than 5°C**, the secondary doctor's data is completely ignored — it's probably a bad reading.

> **Analogy:** If one doctor says your fever is 37°C and another says 43°C — that's an impossible difference. You trust the one who did the proper test, and ignore the outlier.

---

## 🎭 Act 6 — The Lab Tests (12 Intelligence Engines)

This is where SkyGlass goes beyond any normal weather app. The fused data is now passed through **12 specialist labs**, one after another.

| Lab | What It Tests |
|---|---|
| `conditionEngine` | "What should we call this weather? Partly Cloudy? Thunderstorm?" |
| `realFeelEngine` | "It's 32°C, but with 72% humidity — it actually *feels* like 38°C" |
| `aqiHandler` | "Air quality score is 147 — that's Unhealthy for sensitive groups" |
| `confidenceCalc` | "Both doctors agreed — High Confidence in this data" |
| `trendEngine` | "Temperature has been rising for the past 3 requests — it's going UP" |
| `predictionEngine` | "In one hour, it will be approximately 33°C" |
| `rainEngine` | "Humidity is 72%, pressure dropping, clouds at 55% — 63% chance of rain" |
| `anomalyEngine` | "Wind speed is 130 km/h — 🔴 HURRICANE-FORCE WIND WARNING!" |
| `stabilityEngine` | "Conditions have been jumping around a lot — Atmosphere is Volatile" |
| `insightEngine` | Generates human sentences: "Carry an umbrella. UV is extreme before 4 PM." |

After all 12 engines finish, the response object has **~40 fields** of rich, processed data.

---

## 🎭 Act 7 — The Response Goes Back

The server packages everything into one clean JSON (a structured data format) and sends it back to your browser.

`script.js` receives it and:
- Updates the temperature card
- Shows the condition label + emoji
- Fills in the AQI badge
- Shows the confidence indicator
- Renders the 7-day forecast strip
- Updates the rain probability bar
- Shows AI-generated insights in plain English
- Starts the city clock ticking in the right timezone

---

## 🎭 Act 8 — You See the Dashboard

The loading spinner disappears. The full SkyGlass dashboard appears:
- **Live weather** for Mumbai
- **RealFeel temperature** (feels like 38°C, not just 32°C)
- **Air quality badge** (Unhealthy — orange)
- **Rain probability** (63%)
- **7-day forecast**
- **Insights panel** — plain English advice
- **Interactive map** — click any location to search there

> **Total time from your search to seeing results: ~600–800 milliseconds. About as fast as a single blink.**

---

## 🗺️ The Full Journey — At a Glance

```
YOU TYPE "Mumbai"
        │
        ▼
  script.js sends request to server
        │
        ▼
  server.js checks cache → MISS
        │
        ├─── Calls WeatherAPI.com (3-day data + AQI)
        ├─── Calls Open-Meteo.com (7-day data)
        │
        ▼
  normalizer.js → converts both to same format
        │
        ▼
  fusionEngine.js → blends data (60/40 weighted)
        │
        ▼
  12 Engines run → condition, realfeel, aqi, rain, anomaly...
        │
        ▼
  Final JSON (~40 fields) sent to browser
        │
        ▼
  script.js updates every card, chart, map, badge
        │
        ▼
  YOU SEE THE FULL DASHBOARD 🌤️
```

---

*Next: [03_engines_explained.md](./03_engines_explained.md) — Each Engine Explained Simply*
