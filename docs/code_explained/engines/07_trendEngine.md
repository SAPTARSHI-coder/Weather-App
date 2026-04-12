# 📈 trendEngine.js — Line by Line

> **File:** `src/weatherEngine/trendEngine.js`
> **Job:** Remember the last 6 weather readings for each city and calculate whether temperature, humidity, pressure, AQI, and visibility are rising, falling, or stable — and by how much per hour.

---

## What This File Does

Imagine you check Mumbai's temperature every 10 minutes. After an hour you have 6 readings: 28, 29, 30, 31, 32, 33. Clearly rising! By 1°C every 10 minutes → +6°C/hour. This engine does exactly that — but using real statistics (linear regression) for accuracy.

**Analogy:** A doctor doesn't just know your current blood pressure. They track it over 6 visits and say "your pressure has been steadily rising by 5 points per month." The trend is as important as the current reading. This engine provides the trend.

---

## Line 9 — Buffer Size Constant

```js
const MAX_BUFFER = 6;
```

We keep only the last **6** readings per city. Why 6?
- Too few (2-3) → trend is too noisy and unreliable.
- Too many (20+) → old data dilutes the just-happened trends.
- 6 readings = about 1 hour of 10-minute refresh intervals → a good short-term trend window.

---

## Line 10 — City Buffers Map

```js
const cityBuffers = new Map();
```

`new Map()` = a JavaScript key-value store. Better than a plain object for dynamic keys.

`cityKey → [reading1, reading2, ...]`

For example:
- `"mumbai"` → `[{ts: 1700001, temp: 28, ...}, {ts: 1700601, temp: 29, ...}, ...]`
- `"delhi"` → `[{...}, {...}]`

This lives **in server memory** — it persists as long as the server runs. Each city you look up builds its own timeline.

---

## Lines 17–25 — `recordSnapshot()` Function

```js
export function recordSnapshot(cityKey, snap) {
    if (!cityBuffers.has(cityKey)) cityBuffers.set(cityKey, []);
    const buf = cityBuffers.get(cityKey);

    buf.push({ ts: Date.now(), ...snap });

    if (buf.length > MAX_BUFFER) buf.splice(0, buf.length - MAX_BUFFER);
}
```

**Line by line:**

`if (!cityBuffers.has(cityKey)) cityBuffers.set(cityKey, [])` — If this city doesn't have a buffer yet, create an empty array for it.

`cityBuffers.get(cityKey)` — Get the city's array. `buf` is a reference to the same array (not a copy). Any changes to `buf` change the Map's data too.

`buf.push({ ts: Date.now(), ...snap })` — Add a new reading:
- `Date.now()` = current timestamp in milliseconds since 1970 (epoch time). This is how computers store time as a number.
- `...snap` = **spread operator**. Copies all properties from `snap` into the object. So each buffer entry is `{ ts: 1700001234, temp: 32, humidity: 85, pressure_mb: 1010, aqi: 120, visibility: 4 }`.

`buf.splice(0, buf.length - MAX_BUFFER)` — If we now have more than 6 entries, delete the oldest ones.
- `splice(startIndex, deleteCount)` = removes elements from an array.
- `buf.length - MAX_BUFFER` = how many to remove (e.g., if 7 entries and max is 6, remove 1 from position 0).
- This makes it a **rolling window** — always the 6 most recent readings.

---

## Lines 36–56 — `calcSlope()` Function (Linear Regression)

```js
function calcSlope(values, timestamps) {
    const n = values.length;
    if (n < 2) return 0;

    const xs = timestamps.map(t => (t - timestamps[0]) / 3_600_000);
    const ys = values;

    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
        num += (xs[i] - xMean) * (ys[i] - yMean);
        den += (xs[i] - xMean) ** 2;
    }

    if (den === 0) return 0;
    return Math.round((num / den) * 100) / 100;
}
```

**This is the mathematical heart of the trend engine.**

`n < 2` — You need at least 2 points to draw a line through them.

**Converting timestamps to hours:**
```js
const xs = timestamps.map(t => (t - timestamps[0]) / 3_600_000);
```
- `timestamps[0]` = the first reading's time (the reference point, treated as hour 0).
- `t - timestamps[0]` = milliseconds since the first reading.
- `÷ 3_600_000` = convert milliseconds to hours (`1 hour = 3,600,000 ms`).
- The `_` in `3_600_000` is just a visual separator (like a comma in large numbers). JavaScript ignores it.
- Result: `xs` = `[0, 0.17, 0.33, 0.5, 0.67, 0.83]` (hours from start)

**`.map()`** = creates a new array by applying a function to each element.

**Linear regression formula:**
```
slope = Σ[(xi - x̄)(yi - ȳ)] / Σ[(xi - x̄)²]
```
- `x̄` (xMean) = average of x-values (average hours)
- `ȳ` (yMean) = average of y-values (average temperatures)
- `num` = numerator: sum of `(x - mean_x) × (y - mean_y)` for each point
- `den` = denominator: sum of `(x - mean_x)²` for each point
- `slope = num / den`

**`.reduce((a, b) => a + b, 0)`** = sums all values in an array:
- Starts at 0 (the second argument)
- `a` = accumulated total, `b` = current element
- After each step: `a = a + b`

**`(xs[i] - xMean) ** 2`** = `(xs[i] - xMean)` squared. `**` = exponentiation operator in JavaScript.

`if (den === 0) return 0` — If all x values are the same timestamp (only one reading, or all readings at exactly the same moment), division by zero would occur. Return 0 (no slope detectable).

`Math.round((num / den) * 100) / 100` — Round to 2 decimal places.

**Result:** A slope in units of **change-per-hour**. E.g., `temp_trend = +1.5` means temperature is rising at 1.5°C per hour.

---

## Lines 63–88 — `getTrends()` Function

```js
export function getTrends(cityKey) {
    const buf = cityBuffers.get(cityKey) || [];

    if (buf.length < 2) {
        return {
            temp_trend: 0,
            humidity_trend: 0,
            pressure_trend: 0,
            aqi_trend: 0,
            visibility_trend: 0,
            buffer_size: buf.length
        };
    }

    const ts = buf.map(e => e.ts);

    return {
        temp_trend:       calcSlope(buf.map(e => e.temp ?? 0),        ts),
        humidity_trend:   calcSlope(buf.map(e => e.humidity ?? 0),    ts),
        pressure_trend:   calcSlope(buf.map(e => e.pressure_mb ?? 0), ts),
        aqi_trend:        calcSlope(buf.map(e => e.aqi ?? 0),         ts),
        visibility_trend: calcSlope(buf.map(e => e.visibility ?? 0),  ts),
        buffer_size:      buf.length
    };
}
```

`cityBuffers.get(cityKey) || []` — Get the buffer. If city not found, use empty array.

`buf.length < 2` — Need at least 2 readings for regression. Return all zeros if not enough data yet.

`buf.map(e => e.ts)` — Extract all timestamps from the buffer into an array.

For each metric, call `calcSlope()` with:
1. An array of that metric's values from the buffer (e.g., all temperature readings)
2. The array of timestamps

`e.temp ?? 0` — If a reading is missing that field, use 0 (avoids null in the regression).

`buffer_size` — Tells downstream engines how much historical data exists. Used by anomaly and prediction engines to decide confidence levels.

---

## Lines 95–97 — `getBuffer()` Function

```js
export function getBuffer(cityKey) {
    return cityBuffers.get(cityKey) || [];
}
```

Simple getter used by `stabilityEngine.js` to directly access the raw buffer array.

---

## What Happens Next

`recordSnapshot(cityKey, fused)` is called each time weather data is fetched — adds the current reading to the buffer.

`getTrends(cityKey)` is called to compute slopes — returns an object like:
```json
{
    "temp_trend": 1.2,
    "pressure_trend": -0.8,
    "humidity_trend": 2.1,
    "aqi_trend": 5.0,
    "visibility_trend": -0.3,
    "buffer_size": 4
}
```

These trends power the **Anomaly Engine**, **Prediction Engine**, **Insight Engine**, and **Stability Engine**.

---

*Next: [08_predictionEngine.md](./08_predictionEngine.md)*
