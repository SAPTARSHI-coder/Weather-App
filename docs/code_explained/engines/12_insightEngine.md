# 💡 insightEngine.js — Line by Line

> **File:** `src/weatherEngine/insightEngine.js`
> **Job:** Read all weather data — current readings, trends, anomalies, rain probability — and produce up to 4 human-readable insight sentences, prioritised by importance.

---

## What This File Does

After all 11 other engines have done their work, the Insight Engine reads everything and writes a personalised weather summary. Instead of raw numbers, it gives you sentences like "🔥 Extreme heat — stay hydrated" or "🌧️ High chance of rain — carry an umbrella."

**Analogy:** A weather broadcaster. They receive the full meteorological data (temperatures, pressures, maps) and distil it into: "Don't forget your umbrella today, and if you're heading out at noon — wear sunscreen." This engine is that broadcaster.

---

## Lines 17–31 — Function Setup

```js
export function generateInsights(fused, trends, anomalies, rain_prob) {
    const candidates = [];
```

Four inputs:
- `fused` — blended weather data from fusionEngine
- `trends` — rate-of-change slopes from trendEngine
- `anomalies` — danger flags from anomalyEngine
- `rain_prob` — rain category from rainEngine ('Low', 'Medium', 'High')

`const candidates = []` — An array of potential insight objects. Each has:
```js
{ priority: number, text: string }
```
A `priority` number (higher = more important). After all candidates are added, we sort by priority and keep only the top 4.

---

```js
    const temp       = fused.temp        ?? 20;
    const humidity   = fused.humidity    ?? 50;
    const visibility = fused.visibility  ?? 10;
    const aqi        = fused.aqi         ?? 0;
    const cloud      = fused.cloud       ?? 0;
    const uv         = fused.uv          ?? 0;
    const pressure   = fused.pressure_mb ?? 1013;

    const {
        temp_trend, humidity_trend, pressure_trend,
        aqi_trend, visibility_trend, buffer_size
    } = trends;
```

All fields extracted with safe defaults (`??`). Double destructuring — first from `fused`, then from `trends`.

---

## Lines 33–36 — First-Load Note

```js
    if (buffer_size < 2) {
        candidates.push({ priority: 0, text: '📡 Trend analysis available after monitoring starts' });
    }
```

`priority: 0` — Very low priority. Only shown if nothing else qualifies.

When the app first loads and has only one reading (no trend history), we let the user know that trend-based insights will come after monitoring runs for a while.

---

## Lines 38–41 — Basic Threshold Insights

```js
    if (aqi > 150)       candidates.push({ priority: 20, text: 'Unhealthy air quality' });
    if (visibility < 3)  candidates.push({ priority: 19, text: 'Low visibility conditions' });
    if (humidity > 80)   candidates.push({ priority: 18, text: 'High humidity detected' });
```

`priority: 20` = highest priority. AQI > 150 is a health emergency — always shown first.

Note: these are raw `if` statements, not `else if`. Multiple can trigger simultaneously.

---

## Lines 43–50 — Temperature Insights

```js
    if (temp_trend > 2)  candidates.push({ priority: 9, text: `🌡️ Temperature increasing rapidly (+${temp_trend.toFixed(1)}°C/hr)` });
    if (temp_trend < -2) candidates.push({ priority: 9, text: `❄️ Temperature dropping fast (${temp_trend.toFixed(1)}°C/hr)` });
    if (temp > 38)       candidates.push({ priority: 8, text: '🔥 Extreme heat — stay hydrated, avoid outdoor exertion' });
    if (temp < 2)        candidates.push({ priority: 8, text: '🧊 Near-freezing — risk of ice or frost' });
    if (temp >= 28 && humidity >= 70) {
        candidates.push({ priority: 7, text: '🥵 High heat index — feels hotter than temperature suggests' });
    }
```

**Template literals** with dynamic values:
`` `🌡️ Temperature increasing rapidly (+${temp_trend.toFixed(1)}°C/hr)` ``

`temp_trend.toFixed(1)` = converts the number to a string with 1 decimal. E.g., `1.8327` → `"1.8"`.

The final insight: `temp >= 28 && humidity >= 70` — This is the "heat index" check. Both conditions must be true (`&&`). Hot + humid feels much worse than hot + dry because sweat can't evaporate. Priority 7 (moderately important).

---

## Lines 52–64 — Air Quality Insights

```js
    if (aqi_trend > 20)  candidates.push({ priority: 10, text: '🏭 Air quality worsening rapidly — limit outdoor exposure' });
    if (aqi > 200)       candidates.push({ priority: 9,  text: '😷 Very unhealthy air quality — wear a mask outdoors' });
    else if (aqi > 150)  candidates.push({ priority: 8,  text: '😷 Unhealthy air quality — sensitive groups stay indoors' });
    else if (aqi > 100)  candidates.push({ priority: 5,  text: '⚠️ Moderate pollution — sensitive groups exercise caution' });
    else if (aqi < 50 && aqi > 0) {
        candidates.push({ priority: 3, text: '✅ Air quality is excellent — great day for outdoors' });
    }
```

Note the mix of separate `if` (for trend) and `else if` chain (for AQI level). This means:
- The trend insight CAN appear alongside the level insight (because they're separate `if` blocks).
- But only ONE level insight appears (because `else if` stops after the first match).

`aqi < 50 && aqi > 0` — Only celebrate excellent air quality if we actually HAVE a reading (`> 0`). If AQI wasn't available, it defaulted to 0, and we don't want to falsely praise air quality.

---

## Lines 66–72 — Pressure and Storm Insights

```js
    if (pressure_trend < -2) candidates.push({ priority: 10, text: '⛈️ Rapid pressure drop — severe weather approaching' });
    if (pressure_trend < -1) candidates.push({ priority: 7,  text: '💨 Pressure falling — conditions becoming unstable' });
    if (pressure > 1025)     candidates.push({ priority: 2,  text: '🌤️ High pressure — clear and settled conditions likely' });
```

`priority: 2` for high pressure (good news) = very low priority. Positive insights are shown only when nothing else is important.

`pressure > 1025 hPa` = high-pressure system. These bring stable, clear weather. Standard pressure is 1013 hPa — 1025+ is noticeably high.

---

## Lines 74–79 — Humidity and Fog Insights

```js
    if (humidity > 85 && visibility < 3) {
        candidates.push({ priority: 9, text: '🌫️ Fog conditions developing — drive carefully' });
    } else if (humidity > 85) {
        candidates.push({ priority: 5, text: '💧 Very high humidity — discomfort and possible mist' });
    }
    if (humidity_trend > 5) candidates.push({ priority: 6, text: '💧 Humidity surging — moisture levels rising quickly' });
```

The `if...else if` ensures only ONE of the first two fires (more specific fog condition wins over generic humidity). The humidity surge check is a separate `if` — can fire alongside either.

---

## Lines 81–96 — UV and Rain

```js
    if (uv >= 11)     candidates.push({ priority: 8, text: '☀️ Extreme UV — full sun protection essential' });
    else if (uv >= 8) candidates.push({ priority: 6, text: '☀️ Very high UV — sunscreen and shade recommended' });
    else if (uv >= 6) candidates.push({ priority: 4, text: '☀️ High UV — limit midday sun exposure' });

    if (rain_prob === 'High')   candidates.push({ priority: 8, text: '🌧️ High chance of rain — carry an umbrella' });
    else if (rain_prob === 'Medium') candidates.push({ priority: 5, text: '🌦️ Moderate rain chance — be prepared' });
```

`===` (triple equals) = **strict equality** in JavaScript. Checks both value AND type. `'High' === 'High'` = true. `'High' == true` = false (wrong type). Always use `===` in JavaScript to avoid type-coercion bugs.

---

## Lines 93–101 — Perfect Weather

```js
    if (temp >= 18 && temp <= 26 && humidity < 60 && aqi < 60 && cloud < 40) {
        candidates.push({ priority: 4, text: '🌟 Near-perfect weather conditions right now' });
    }
```

5 conditions must ALL be true (`&&`):
- Temperature: 18–26°C (comfortable range)
- Humidity: under 60% (not sticky)
- AQI: under 60 (good air)
- Cloud cover: under 40% (mostly sunny)

This insight only fires when conditions are genuinely excellent.

---

## Lines 98–106 — Sorting and Deduplication

```js
    candidates.sort((a, b) => b.priority - a.priority);
    let finalTexts = candidates.map(c => c.text);
    finalTexts = [...new Set(finalTexts)].slice(0, 4);

    if (finalTexts.length === 0) {
        finalTexts.push("Stable conditions expected");
    }

    return finalTexts;
```

`.sort((a, b) => b.priority - a.priority)` — Sorts candidates by priority **descending** (highest first). The sort callback returns a negative number if `b` should come first.

`.map(c => c.text)` — Extract just the text strings (discard the priority numbers now).

`[...new Set(finalTexts)]` — **Deduplication**. `new Set()` automatically removes duplicate strings. The `[...]` spread converts the Set back to a regular array.

`.slice(0, 4)` — Take only the first 4 (the top-priority ones).

The fallback `"Stable conditions expected"` fires only if ALL conditions produced zero candidates — almost never happens.

`return finalTexts` — An array of up to 4 strings.

---

## What Happens Next

```json
[
    "🔥 Extreme heat — stay hydrated, avoid outdoor exertion",
    "😷 Unhealthy air quality — sensitive groups stay indoors",
    "🌧️ High chance of rain — carry an umbrella",
    "💧 Humidity surging — moisture levels rising quickly"
]
```

These 4 strings appear as bullet points in the **Smart Insights** section (bottom of the Intelligence Panel).

---

*You have now read all 12 engine explanations. Return to [../00_index.md](../00_index.md) to continue.*
