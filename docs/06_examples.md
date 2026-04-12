# 📍 Real Examples — Watch the System Think

> These are not made up. These show exactly how the system processes data step by step for real scenarios.

---

## Example 1 — Mumbai on a Humid Summer Day

**Scenario:** It's April. Mumbai is hot and humid. You search "Mumbai."

### Step 1 — Two Doctors Give Their Readings

| Measurement | WeatherAPI Says | Open-Meteo Says |
|---|---|---|
| Temperature | 33°C | 31°C |
| Humidity | 84% | 82% |
| Wind | 22 km/h | 18 km/h |
| Cloud Cover | 60% | 55% |
| Precipitation | 0 mm | 0 mm |

### Step 2 — Fusion (Blending)

```
Temperature = (33 × 0.60) + (31 × 0.40) = 19.8 + 12.4 = 32.2°C ≈ 32°C
Wind        = (22 × 0.70) + (18 × 0.30) = 15.4 + 5.4  = 20.8 km/h
Cloud       = (60 × 0.50) + (55 × 0.50) = 30   + 27.5  = 57.5% ≈ 58%
Humidity    = 84% (WeatherAPI only — 100% weight)
```

Difference between sources: |33 - 31| = 2°C → Within 5°C threshold → both are used. ✅

### Step 3 — What the Engines Calculate

**conditionEngine:**
- Humidity = 84%, Cloud = 58%, Precip = 0mm, Visibility = 4km
- Result: `"Partly Cloudy"` + ☁️

**realFeelEngine:**
- Temp = 32°C, Humidity = 84%, Wind = 21 km/h
- Heat index kicks in (humidity > 70%)
- Result: **Feels like 39°C** (7 degrees hotter than actual — humidity traps heat)

**aqiHandler:**
- PM2.5: 55 µg/m³, CO: 890 µg/m³
- AQI resolved to: **112**
- Category: `"Unhealthy for Sensitive Groups"` 🟠

**trendEngine:**
- Previous 3 readings: 30°C → 31°C → 32°C
- Slope: +0.5°C per reading → ↑ Rising

**predictionEngine:**
- Current: 32°C, Slope: +0.5°C/30min
- Predicted (1 hr later): `33°C` with `"Partly Cloudy"`

**rainEngine:**
- Humidity: 84% → +20 points
- Pressure trend: slightly falling → +10 points
- Cloud: 58% → +10 points
- Visibility: 4km (normal) → +0 points
- Precipitation: 0mm → +0 points
- **Total: 40% rain probability**

**anomalyEngine:**
- Temp: 32°C (below 45°C threshold)
- AQI: 112 (below 200 threshold)
- Wind: 21 km/h (below 120 threshold)
- Result: **No anomalies detected** ✅

**insightEngine:**
- Rain = 40%, AQI = 112, feels like 39°C, UV = 8
- Output:
  1. *"Feels like 39°C due to high humidity — stay hydrated."*
  2. *"Air quality is moderately unhealthy — sensitive groups avoid prolonged outdoor activity."*
  3. *"Rain possible later in the day — consider an umbrella."*

### Final Dashboard Shows:
```
Mumbai — Partly Cloudy ☁️
32°C / 90°F  |  Feels like 39°C
↑ Rising  |  Confidence: Medium  |  Sources: 2

Rain Probability: 40%
AQI: 112  🟠  Unhealthy for Sensitive Groups
Predicted (1hr): 33°C Partly Cloudy

💡 Insights:
  → Feels like 39°C. Stay hydrated.
  → Air quality is moderately unhealthy.
  → Rain possible later. Take an umbrella.
```

---

## Example 2 — Delhi in Winter Fog

**Scenario:** December. Delhi winters are famous for dense fog and terrible air quality.

### What the APIs Return

| Measurement | WeatherAPI | Open-Meteo |
|---|---|---|
| Temperature | 9°C | 10°C |
| Humidity | 93% | 91% |
| Visibility | 0.3 km | 0.4 km |
| Wind | 4 km/h | 3 km/h |
| Cloud | 90% | 85% |
| AQI (PM2.5) | 280 µg/m³ | — |

### Fusion Result

```
Temperature = (9 × 0.60) + (10 × 0.40) = 5.4 + 4.0 = 9.4°C ≈ 9°C
Visibility  = (0.3 × 0.50) + (0.4 × 0.50) = 0.15 + 0.20 = 0.35 km
Humidity    = 93%
```

### Engine Results

**conditionEngine:**
- Visibility = 0.35 km (< 0.5 km), Humidity = 93%
- Rule: IF visibility < 0.5 AND humidity > 90% → `"Dense Fog"` 🌫️

**realFeelEngine:**
- Temp = 9°C, Wind = 4 km/h (calm)
- No significant wind chill at this speed
- Result: **Feels like 8°C**

**aqiHandler:**
- PM2.5: 280 → AQI = **245**
- Category: `"Very Unhealthy"` 🟣
- Tip: `"Everyone should avoid outdoor activity. Wear N95 if going out."`

**rainEngine:**
- Humidity = 93% → +35 points
- Cloud = 87% → +20 points
- Visibility = 0.35 km → +15 points
- Precipitation = 0mm → +0 points
- **Total: 70% rain probability**

**anomalyEngine:**
```
⚠️ Near-Zero Visibility: 0.35 km < 0.5 km threshold
   → Alert: "🟠 Dangerous Fog — Exercise extreme caution while driving"

⚠️ Dangerous AQI: 245 > 200 threshold
   → Alert: "🔴 Very Unhealthy Air — Everyone should avoid outdoor activity"
```

**insightEngine outputs:**
1. *"Visibility is critically low at 0.35 km — do not drive without fog lights."*
2. *"Air quality is very unhealthy (AQI 245). Stay indoors and close windows."*
3. *"70% chance of rain or drizzle — umbrella essential."*

### Final Dashboard Shows:
```
Delhi — Dense Fog 🌫️
9°C  |  Feels like 8°C
→ Stable  |  Confidence: High  |  Sources: 2

🔴 ALERT: Very Unhealthy Air (AQI 245)
🟠 ALERT: Dangerous Fog (Visibility: 0.35 km)

Rain Probability: 70%

💡 Insights:
  → Visibility is critically low. Do not drive.
  → Stay indoors. Close windows. AQI is very unhealthy.
  → Rain likely — take an umbrella.
```

**This is something NO normal weather app shows you.** They just say "9°C, Foggy."

---

## Example 3 — London During a Pressure Drop (Storm Coming)

**Scenario:** Mid-afternoon. London. Pressure has been falling for the past 3 hours.

### Trend Engine Readings

```
Entry 1 (past): pressure = 1015 mb
Entry 2:        pressure = 1012 mb
Entry 3:        pressure = 1009 mb
Entry 4 (now):  pressure = 1006 mb
```

The Trend Engine calculates the slope:
- Drop of ~3 mb every 30 minutes
- That's -6 mb per hour — a **rapid pressure drop**

### Anomaly Engine Fires

```
Rule: IF pressure drops > 5 mb per hour → Alert
Actual drop: 6 mb/hr > 5 threshold → ANOMALY DETECTED

Alert: "🟠 Rapid Pressure Drop — Storm system approaching. Conditions may worsen rapidly."
```

### Rain Engine

```
Pressure trend: −6 mb/hr → +25 points (maximum severity)
Humidity: 78% → +15 points
Cloud: 70% → +10 points
Precipitation: 0.4mm → +25 points
---------------------------------
Total: 75% 🌧️
```

### Insight Engine

1. *"A storm system is approaching — barometric pressure dropped 6 mb in the last hour."*
2. *"75% chance of rain within the next 2 hours. Bring an umbrella."*
3. *"Conditions are volatile — expect rapid changes."*

---

## Example 4 — Two Sources Wildly Disagree (Outlier Handling)

**Scenario:** You search for a small city. WeatherAPI's ground station reads correctly. Open-Meteo's regional model is off.

| WeatherAPI | Open-Meteo |
|---|---|
| 24°C | 31°C |

### Fusion Engine Detects the Problem

```
Difference = |24 - 31| = 7°C
Threshold  = 5°C

7 > 5 → OUTLIER DETECTED
→ Ignoring Open-Meteo temperature
→ Using WeatherAPI only: 24°C
```

### Confidence Engine Responds

```
Sources used: 1 (only WeatherAPI — Open-Meteo discarded as outlier)
Confidence: "Low" 🟠
Reason: "High disagreement between sources — secondary data discarded"
```

Dashboard shows:
```
🟠 Low Confidence · Sources: 1 (outlier removed) · Updated: 3:45 PM
```

The user now knows: *"This data might not be perfect. Take it with a grain of salt."*

---

## Example 5 — Cache Hit Scenario

**Scenario:** 50 users search for "Kolkata" within 10 minutes.

```
User 1 at 3:00 PM:
  → Cache check: MISS
  → Server calls WeatherAPI + Open-Meteo (takes 650ms)
  → Processes 12 engines
  → Saves to cache: "fused:kolkata" at 3:00 PM
  → Sends response

Users 2–50 (3:01 PM to 3:09 PM):
  → Cache check: HIT (saved 2–9 minutes ago, < 10 min TTL)
  → Returns from memory instantly (takes ~2ms)
  → No API calls made

User 51 at 3:11 PM:
  → Cache check: MISS (10 minutes expired, data is stale)
  → Fetches fresh data again → 650ms
  → Saves new cache entry
```

**Result:**
- 50 users served → only **2 API calls** (instead of 100)
- Users 2–50 experience **<5 ms** response time vs 650 ms

---

*Next: [07_why_better.md](./07_why_better.md) — Why SkyGlass Beats Normal Weather Apps*
