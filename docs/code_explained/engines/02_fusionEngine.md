# ⚗️ fusionEngine.js — Line by Line

> **File:** `src/weatherEngine/fusionEngine.js`
> **Job:** Take two normalised weather snapshots (from WeatherAPI and Open-Meteo) and intelligently blend them into one single, reliable value using weighted maths and outlier protection.

---

## What This File Does

Two weather services report temperature. WeatherAPI says 33°C. Open-Meteo says 31°C. Which do you trust? Answer: **both** — but not equally. You trust the better source more. This file does that blending.

**Analogy:** Two judges score a gymnast's performance. Judge A gives 9.2, Judge B gives 8.8. Instead of ignoring one or taking a plain average, you weight Judge A at 60% and Judge B at 40%, giving `(9.2×0.6) + (8.8×0.4) = 9.04`. That's the fusion formula.

---

## Lines 7–12 — The WEIGHTS Table

```js
const WEIGHTS = {
    temp:     { primary: 0.6, secondary: 0.4 },
    wind_kph: { primary: 0.7, secondary: 0.3 },
    cloud:    { primary: 0.5, secondary: 0.5 },
    humidity: { primary: 1.0, secondary: 0.0 },
};
```

`const WEIGHTS` = a constant object (dictionary) defined at the top of the file. It's available to all functions in this file.

This table captures **engineering decisions** about source trust:

| Field | WeatherAPI % | Open-Meteo % | Why |
|---|---|---|---|
| `temp` | 60% | 40% | WeatherAPI uses ground stations — slightly better for current temp |
| `wind_kph` | 70% | 30% | Ground anemometers are more accurate than satellite models |
| `cloud` | 50% | 50% | Both use satellite data — equally reliable |
| `humidity` | 100% | 0% | Open-Meteo's current-hour humidity is known to lag |

---

## Line 14

```js
const TEMP_OUTLIER_THRESHOLD = 5; // °C
```

A named constant. If the two temperature readings differ by more than 5°C, something is wrong with one source — discard the secondary. Using a named constant (instead of writing `5` everywhere) makes it easy to change this threshold later in one place.

---

## Lines 19–24 — `weightedAvg()` Helper Function

```js
function weightedAvg(a, b, wa, wb) {
    if (a == null && b == null) return null;
    if (a == null) return b;
    if (b == null) return a;
    return (a * wa + b * wb) / (wa + wb);
}
```

`function weightedAvg(a, b, wa, wb)` — Takes 4 inputs:
- `a` = first value (WeatherAPI reading)
- `b` = second value (Open-Meteo reading)
- `wa` = weight for `a`
- `wb` = weight for `b`

**The null guards (lines 20–22):**
- If both are missing → return `null` (we have nothing).
- If only `a` is missing → return `b` (use what we have).
- If only `b` is missing → return `a`.

**Line 23 — The formula:**
```
result = (a × wa + b × wb) / (wa + wb)
```
The division by `(wa + wb)` normalises the result. Since our weights always add to 1.0 (e.g., 0.6 + 0.4 = 1.0), this division has no effect in practice — but it makes the formula correct even if weights don't sum to 1.

**Example:**
```
weightedAvg(33, 31, 0.6, 0.4)
= (33 × 0.6 + 31 × 0.4) / (0.6 + 0.4)
= (19.8 + 12.4) / 1.0
= 32.2
```

---

## Lines 31–42 — `removeOutlier()` Helper Function

```js
function removeOutlier(primary, secondary, threshold) {
    if (primary == null || secondary == null) {
        return { primary, secondary };
    }
    const diff = Math.abs(primary - secondary);
    if (diff > threshold) {
        return { primary, secondary: null };
    }
    return { primary, secondary };
}
```

`Math.abs(primary - secondary)` — Absolute value of the difference. `Math.abs(-7) = 7`, `Math.abs(7) = 7`. We want the size of the gap, not the sign.

`if (diff > threshold)` — If the gap is bigger than 5°C, something's wrong.

`return { primary, secondary: null }` — Keep primary (the trusted WeatherAPI value), discard secondary (set it to `null`). When `null` is passed to `weightedAvg`, it returns just the primary value.

`return { primary, secondary }` — If they're close enough, return both unchanged.

**Why trust primary over secondary?** WeatherAPI uses real ground stations. Open-Meteo uses satellite models. Ground truth wins.

---

## Lines 50–56 — Start of `fuseSnapshots()`

```js
export function fuseSnapshots(primary, secondary) {
    const { primary: safeTemp1, secondary: safeTemp2 } = removeOutlier(
        primary.temp,
        secondary.temp,
        TEMP_OUTLIER_THRESHOLD
    );
```

`export function fuseSnapshots(primary, secondary)` — The main function of this file. Takes two normalised snapshots.

`removeOutlier(primary.temp, secondary.temp, 5)` — Checks temperature specifically (5°C threshold). May discard `secondary.temp`.

`const { primary: safeTemp1, secondary: safeTemp2 }` = **destructuring with renaming**. The function returns `{ primary, secondary }`. We rename them to `safeTemp1` and `safeTemp2` to avoid confusion with the function parameters also named `primary` and `secondary`.

---

## Lines 58–81 — Building the Fused Object

```js
    const fused = {
        temp: weightedAvg(safeTemp1, safeTemp2, WEIGHTS.temp.primary, WEIGHTS.temp.secondary),
        feels_like: primary.feels_like,
        humidity: weightedAvg(primary.humidity, secondary.humidity, WEIGHTS.humidity.primary, WEIGHTS.humidity.secondary),
        wind_kph: weightedAvg(primary.wind_kph, secondary.wind_kph, WEIGHTS.wind_kph.primary, WEIGHTS.wind_kph.secondary),
        wind_dir: primary.wind_dir,
        wind_degree: primary.wind_degree,
        cloud: weightedAvg(primary.cloud, secondary.cloud, WEIGHTS.cloud.primary, WEIGHTS.cloud.secondary),
        visibility: primary.visibility,
        uv: primary.uv,
        is_day: primary.is_day,
        aqi: primary.aqi,
        precip_mm: primary.precip_mm,
        pressure_mb: primary.pressure_mb,
        ...
        sources_used: [primary.source],
        temp_diff: Math.abs(primary.temp - secondary.temp)
    };
```

For each field, a deliberate decision is made:

| Field | Decision |
|---|---|
| `temp` | Weighted blend (60/40) with outlier removal |
| `feels_like` | WeatherAPI only — Open-Meteo doesn't compute this |
| `humidity` | WeatherAPI only (100% weight) |
| `wind_kph` | Weighted blend (70/30) |
| `cloud` | Equal blend (50/50) |
| `visibility` | WeatherAPI only — more granular |
| `uv` | WeatherAPI only — Open-Meteo current_weather doesn't include UV |
| `wind_dir` | WeatherAPI only — Open-Meteo doesn't provide it |

`sources_used: [primary.source]` — Starts as array with just `'WeatherAPI'`. Open-Meteo is added below if it was usable.

`temp_diff: Math.abs(primary.temp - secondary.temp)` — Records how much the two sources disagreed. This is used by `confidenceCalc.js`.

---

## Lines 84–86 — Tracking Secondary Source

```js
    if (secondary.temp != null && safeTemp2 != null) {
        fused.sources_used.push(secondary.source);
    }
```

`Array.push()` = adds an element to the end of an array.

If Open-Meteo's temperature was valid AND it wasn't discarded as an outlier → add `'Open-Meteo'` to the sources list.

If it was discarded, `safeTemp2` is `null`, so this condition fails and Open-Meteo is NOT listed as a source. The confidence calculator will then give `Low` confidence.

---

## Lines 88–91 — Rounding for Cleanliness

```js
    ['temp', 'feels_like', 'humidity', 'wind_kph', 'cloud'].forEach(key => {
        if (fused[key] != null) fused[key] = Math.round(fused[key] * 10) / 10;
    });
```

`['temp', 'feels_like', ...]` = an array of key names (strings).

`.forEach(key => { ... })` = loop through each key name and run the function.

`Math.round(fused[key] * 10) / 10` = rounds to 1 decimal place.
- `32.247 × 10 = 322.47`
- `Math.round(322.47) = 322`
- `322 / 10 = 32.2` ✅

Instead of displaying `32.247°C`, the dashboard shows `32.2°C`.

---

## What Happens Next

The `fused` object is passed to all 12 engines. Every engine reads from it. It's the single source of truth for the rest of the pipeline.

---

*Next: [03_conditionEngine.md](./03_conditionEngine.md)*
