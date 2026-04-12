# 🧠 All 12 Intelligence Engines — Simply Explained

> Each engine is a small specialist. Together they make your weather dashboard smart.
> Think of them as 12 different experts in one hospital.

---

## 🔧 Engine 1 — `normalizer.js` — The Translator

### What problem does it solve?

WeatherAPI and Open-Meteo both send weather data — but in completely different packaging.

| WeatherAPI calls it | Open-Meteo calls it |
|---|---|
| `current.temp_c` | `current_weather.temperature` |
| `current.humidity` | `hourly.relativehumidity_2m[0]` |
| `current.wind_kph` | `current_weather.windspeed` |

If the code had to handle both formats everywhere, it would be a mess. Imagine if every employee in a hospital used a different language — nothing would work.

### What does it do?

Converts **both** API responses into one **identical structure** called a Canonical Snapshot:

```
WeatherAPI response  ---→  normalizer  ---→  { temp: 32, humidity: 72, wind_kph: 18 ... }
Open-Meteo response  ---→  normalizer  ---→  { temp: 31, humidity: 69, wind_kph: 16 ... }
```

Now every other engine knows exactly what fields to look for — always.

> **Real-life analogy:** You have two doctors' reports written in different formats. A medical secretary re-types both into the hospital's standard one-page form. Now any specialist can read either report without confusion.

---

## 🔧 Engine 2 — `fusionEngine.js` — The Blender

### What problem does it solve?

WeatherAPI says Mumbai is 32°C. Open-Meteo says 31°C. Which one is right?

You can't just pick one arbitrarily. And you can't just average them equally — WeatherAPI is more detailed and reliable for current conditions.

### What does it do?

Uses **weighted averaging** — trust one source more, but don't ignore the other:

```
Final Temp = (WeatherAPI × 60%) + (Open-Meteo × 40%)
           = (32 × 0.60)        + (31 × 0.40)
           = 19.2 + 12.4
           = 31.6°C
```

It also **protects against bad data**: if the two sources disagree by more than 5°C, it assumes one has faulty data and ignores it entirely.

Different measurements get different weights based on which source is more reliable for that specific thing:

| Measurement | WeatherAPI Weight | Open-Meteo Weight |
|---|---|---|
| Temperature | 60% | 40% |
| Wind speed | 70% | 30% |
| Humidity | 100% | 0% |
| Cloud cover | 50% | 50% |

> **Real-life analogy:** Two chefs give you ratings for a restaurant. One is a Michelin-star judge (trust them 60%). One is your neighbour (trust them 40%). If the Michelin judge says 9/10 and the neighbour says 10/10, the final score is 9.4. But if one says 10 and the other says 2 — something's clearly wrong. Discard the outlier.

---

## 🔧 Engine 3 — `conditionEngine.js` — The Label Maker

### What problem does it solve?

WeatherAPI might say "Mist". Open-Meteo might say "Foggy". For the same weather. Inconsistent labels confuse users.

Also, raw API condition text can be vague or wrong — *"Patchy rain nearby"* isn't very helpful.

### What does it do?

Ignores both API text labels. Instead, it **looks at the actual numbers** (humidity, visibility, cloud cover, precipitation) and **derives the condition from scratch** using logical rules:

```
IF visibility < 1 km AND humidity > 85%  → "Dense Fog"
IF precipitation > 5 mm AND cloud > 70%  → "Heavy Rain"
IF cloud < 20% AND humidity < 50%         → "Clear Sky"
```

It also returns an emoji (🌧️, ☀️, ⛈️) and an icon name for the UI.

> **Real-life analogy:** You don't ask two weather reporters what to label the weather. You look outside yourself: *Can I see the buildings across the street? No. Is it raining hard? Yes. Call it Heavy Rain.* That's exactly what this engine does.

---

## 🔧 Engine 4 — `realFeelEngine.js` — The Body Thermometer

### What problem does it solve?

Temperature alone is misleading. 28°C in a desert feels very different from 28°C in coastal Mumbai at 85% humidity.

### What does it do?

Calculates how hot or cold it **actually feels to your body**, combining 3 physical effects:

1. **Wind Chill** — When wind blows, it takes body heat away faster. 15°C with strong wind feels like 10°C.
   ```
   Wind Chill = 13.12 + (0.6215 × Temp) − (11.37 × WindSpeed^0.16) + (0.3965 × Temp × WindSpeed^0.16)
   ```

2. **Heat Index** — When humidity is high, sweat doesn't evaporate. Your body can't cool down. 30°C at 80% humidity feels like 37°C.
   ```
   Heat Index = combines temperature + humidity using Rothfusz formula
   ```

3. **UV Adjustment** — Direct sunlight on skin adds perceived heat.

The engine uses the appropriate formula based on current conditions and produces one single **RealFeel** number.

> **Real-life analogy:** Your thermometer says 28°C. But you step outside and feel like you're melting because it's 85% humidity and no wind. The RealFeel engine captures that — it says "Feels like 36°C." AccuWeather calls this RealFeel™. We built our own version.

---

## 🔧 Engine 5 — `aqiHandler.js` — The Air Quality Doctor

### What problem does it solve?

WeatherAPI gives raw pollutant readings:
- CO: 230 µg/m³
- NO₂: 45 µg/m³
- PM2.5: 78 µg/m³
- O₃: 92 µg/m³

A normal person doesn't know what to do with that. What does 78 µg/m³ of PM2.5 mean? Is it dangerous?

### What does it do?

1. **Resolves** all pollutant readings into one **AQI number** (0 to 500)
2. **Categorizes** it:
   - 0–50: 🟢 Good
   - 51–100: 🟡 Moderate
   - 101–150: 🟠 Unhealthy for Sensitive Groups
   - 151–200: 🔴 Unhealthy
   - 201–300: 🟣 Very Unhealthy
   - 301–500: 🟤 Hazardous
3. **Generates a personalized health tip** in plain English:
   - "Air quality is acceptable. Enjoy your outdoor activities."
   - "Children, elderly, and those with respiratory conditions should stay indoors."

> **Real-life analogy:** A blood test gives you dozens of separate measurements. But the doctor doesn't list them all — they say "Your overall health score is 78/100 — Good, but watch your blood pressure." AQI works the same way.

---

## 🔧 Engine 6 — `confidenceCalc.js` — The Reliability Judge

### What problem does it solve?

Sometimes Open-Meteo is down. Or the two sources disagree wildly. Should you show the user a number you're not sure about without telling them?

### What does it do?

Scores the **reliability of the data** just shown to the user:

| Situation | Confidence Level |
|---|---|
| Both sources available AND agree within 2°C | 🟢 High |
| Both sources available, disagree 2–5°C | 🟡 Medium |
| Only one source available | 🟠 Low |
| Sources disagree by more than 5°C | 🔴 Very Low |

The dashboard shows a small badge like: `✅ High Confidence · Sources: 2 · Updated: 2:15 PM`

> **Real-life analogy:** A judge on a court case says: "We have strong evidence from two independent witnesses who agree — High Confidence in the verdict." vs "We only have one witness and their story keeps changing — Low Confidence."

---

## 🔧 Engine 7 — `trendEngine.js` — The Memory

### What problem does it solve?

To know if temperature is *rising* or *falling*, you need to remember past readings — not just the current one.

### What does it do?

Every time you (or anyone) searches for a city, the engine **stores the values** in a fixed-size memory called a **Ring Buffer** — like a circular notepad that only keeps the last 12 entries. When it's full, the oldest entry is erased to make room for the newest.

```
Entry 1: 11:00 AM → Temp: 28°C
Entry 2: 11:30 AM → Temp: 29°C
Entry 3: 12:00 PM → Temp: 31°C
Entry 4: 12:30 PM → Temp: 32°C  ← newest
```

It then uses **Linear Regression** (a math formula that finds the direction of change) to calculate the **slope** — is it going up, down, or flat?

- Positive slope → ↑ Rising
- Negative slope → ↓ Falling
- Near-zero slope → → Stable

This powers the "↑ Rising" and "↓ Falling" labels you see on the dashboard for temperature, humidity, pressure, and AQI.

> **Real-life analogy:** You check your weight every day for a week. On Day 1 you were 78kg, Day 4 was 77kg, Day 7 is 76kg. The trend is clear: you're losing weight (downward slope). The Trend Engine does the same thing with temperature.

---

## 🔧 Engine 8 — `predictionEngine.js` — The Fortune Teller

### What problem does it solve?

Knowing the current temperature is useful. Knowing what it'll be in **one hour** is more useful — especially if you're planning to step out.

### What does it do?

Uses the **slope from the Trend Engine** to project one hour forward:

```
Predicted Temp = Current Temp + (Temperature Slope × 1 hour)

Example:
Current Temp = 32°C
Slope = +0.8°C per 30 minutes
Prediction = 32 + (0.8 × 2) = 33.6°C in 1 hour
```

It also adjusts for **time of day** — temperatures naturally peak around 2–3 PM and drop after sunset. The engine accounts for this.

Output: *"It will be approximately 34°C in one hour, with Partly Cloudy conditions."*

> **Real-life analogy:** You see that a car on the highway is travelling at 100 km/h and has been speeding up by 10 km/h every minute. You can predict that in 6 minutes, it'll be doing 160 km/h. The Prediction Engine does this with temperature.

---

## 🔧 Engine 9 — `rainEngine.js` — The Umbrella Advisor

### What problem does it solve?

"Will it rain?" is the most googled weather question in the world. But a simple "Yes/No" isn't helpful. You want a **probability** — "70% chance of rain" lets you make an informed decision.

### What does it do?

Combines **5 separate factors** into a single rain probability score:

| Factor | Why it matters | Score contribution |
|---|---|---|
| **Humidity** | Above 80% = air nearly saturated with water | +20 to +35 points |
| **Pressure trend** | Falling pressure = storm approaching | +10 to +25 points |
| **Cloud cover** | More clouds = more chance of rain | +5 to +20 points |
| **Visibility** | Low visibility = rain may already be starting | +10 to +15 points |
| **Current precipitation** | Rain already happening? Score this highest | +25 to +40 points |

All scores are added up and clamped between 0 and 100.

Result: **63% Chance of Rain** → *"Carry an umbrella, just in case."*

> **Real-life analogy:** A detective doesn't convict based on one clue. They look at fingerprints + motive + alibi + witnesses. The Rain Engine is that detective — it weighs all 5 evidence types before declaring a verdict.

---

## 🔧 Engine 10 — `anomalyEngine.js` — The Emergency Alert System

### What problem does it solve?

Normal weather apps never warn you when something *dangerous* is happening — they just show numbers. But if winds are 130 km/h or temperature is 47°C, you need an **immediate warning**.

### What does it do?

Scans the fused data for values that cross **danger thresholds**:

| Danger Condition | Threshold | Alert Shown |
|---|---|---|
| Extreme heat | Temp > 45°C | 🔴 Extreme Heat Warning |
| Extreme cold | Temp < −20°C | 🔴 Extreme Cold Warning |
| Pressure crash | Drop > 5 mb/hour | 🟠 Rapid Pressure Drop (storm incoming) |
| Dangerous air | AQI > 200 | 🔴 Very Unhealthy Air |
| Near-zero visibility | < 0.5 km | 🟠 Dangerous Fog (don't drive) |
| Hurricane winds | > 120 km/h | 🔴 Hurricane-Force Wind |

If any anomaly is detected, a **warning banner** appears at the top of the dashboard.

> **Real-life analogy:** A hospital's vital signs monitor beeps an alarm when heart rate goes above 150 or below 40 — when it crosses danger thresholds. The Anomaly Engine is that alarm system for weather.

---

## 🔧 Engine 11 — `stabilityEngine.js` — The Chaos Detector

### What problem does it solve?

If the temperature is bouncing between 24°C and 32°C every 30 minutes, something unstable is happening — a storm might be building. But if it's been steadily at 30°C all morning, conditions are calm.

### What does it do?

Looks at the **ring buffer** of past temperature readings and calculates **variance** — how much the values are jumping around.

- **Low variance** → Stable → "Conditions are consistent. Changes unlikely"
- **Medium variance** → Unsettled → "Some variability. Keep an eye out"
- **High variance** → Volatile → "Conditions are erratic. Possible storm developing"

The stability label appears on the dashboard to give users advanced warning of turbulent conditions.

> **Real-life analogy:** If a patient's heart rate reading is 70, 72, 71, 70, 73 — stable. If it's 70, 90, 60, 100, 50 — unstable and alarming, even if the average is 74. The Stability Engine catches that chaos.

---

## 🔧 Engine 12 — `insightEngine.js` — The Human Translator

### What problem does it solve?

After all 11 previous engines run, we have numbers everywhere: rain probability: 63%, AQI: 147, UV: 9, stability: Volatile...

Most people don't know what to **do** with those numbers.

### What does it do?

Converts all the numbers into **prioritized plain-English sentences** that tell you what to actually do:

```
Inputs:
  rain_probability = 63
  aqi = 147
  uv = 9
  condition = "Partly Cloudy"
  anomalies = []

Output (sorted by importance):
  1. "Rain is likely within the next few hours — carry an umbrella."
  2. "Air quality is unhealthy. Wear a mask outdoors."
  3. "UV index is very high — avoid direct sunlight between 11 AM and 4 PM."
```

The engine checks every condition, assigns each a priority score, sorts them, and returns the top 2–5 most important insights for the dashboard's insight panel.

> **Real-life analogy:** After all your lab tests come back, the doctor doesn't hand you a stack of papers and say "figure it out." They say: "Your cholesterol is the biggest concern. Cut fried food. Also take this vitamin D supplement." That's what the Insight Engine does — it translates data into action.

---

## 🗺️ How the 12 Engines Connect

```
Fused Data
    │
    ├── conditionEngine  → condition label + emoji
    ├── realFeelEngine   → "Feels like X°C"
    ├── aqiHandler       → AQI number + category + tip
    ├── confidenceCalc   → reliability badge
    ├── trendEngine      → ↑ Rising / ↓ Falling trends
    ├── predictionEngine → "In 1 hour: 34°C"
    ├── rainEngine       → "63% chance of rain"
    ├── anomalyEngine    → 🔴 Warning alerts
    ├── stabilityEngine  → Stable / Volatile label
    └── insightEngine    → "Carry an umbrella. Wear a mask."
```

All outputs merge into the **final ~40-field response object** sent back to the browser.

---

*Next: [04_features_explained.md](./04_features_explained.md) — Why Multiple APIs? What is Caching?*
