# 🌡️ realFeelEngine.js — Line by Line

> **File:** `src/weatherEngine/realFeelEngine.js`
> **Job:** Calculate how hot or cold the weather actually FEELS to a human body — not just what the thermometer says.

---

## What This File Does

A thermometer says 32°C. But if it's 90% humid with no wind, your body can't sweat properly and it feels like 40°C. On another day at 32°C with a strong breeze, it feels like 28°C. This engine computes that "felt" temperature.

**Analogy:** The thermometer tells you "the water is 70°C." But whether it feels like boiling to you depends on whether you're jumping in or just dipping a finger. Context matters. This engine provides that context.

---

## Lines 9 — Smoothing Cache

```js
const smoothingCache = new Map();
```

`new Map()` = creates an empty key-value store. This one maps city names to their last known temperature. It's used by the `applySmoothing()` function below.

This `Map` is **module-level** — it lives as long as the server is running. Every city that gets looked up gets an entry here.

---

## Lines 22–39 — `calcRealFeel()` Function

```js
export function calcRealFeel(temp, humidity, wind_kph, uv = 0) {
```

`uv = 0` = a **default parameter**. If `uv` is not passed in, it defaults to `0`. Prevents a crash when UV data is missing.

---

```js
    if (temp == null) return null;
```

Guard check — if temperature itself is missing, we can't compute anything. Return `null` immediately.

---

```js
    const h = humidity ?? 50;
    const w = wind_kph ?? 0;
    const u = uv ?? 0;
```

`??` = nullish coalescing. If humidity is null/undefined, assume 50% (typical indoor humidity). If wind is unknown, assume 0 (no effect). If UV is unknown, assume 0.

We use placeholder constants so the formula below never crashes or produces wild numbers.

---

```js
    let feels = temp
        + (h * 0.10)
        - (w * 0.20)
        + (u * 0.30);
```

**The RealFeel formula:**
```
feels = temp + (humidity × 0.10) - (wind × 0.20) + (UV × 0.30)
```

Each part explained:

| Component | Effect | Why |
|---|---|---|
| `+ (humidity × 0.10)` | High humidity → feels hotter | Humid air prevents sweat evaporation — your natural cooling system fails |
| `- (wind × 0.20)` | Strong wind → feels cooler | Wind carries body heat away faster (wind chill effect) |
| `+ (UV × 0.30)` | High UV → feels hotter | Solar radiation adds heat directly to skin |

**Example — Mumbai in summer:**
- Temp: 32°C, Humidity: 85%, Wind: 12 km/h, UV: 8
- `feels = 32 + (85 × 0.10) - (12 × 0.20) + (8 × 0.30)`
- `feels = 32 + 8.5 - 2.4 + 2.4`
- `feels = 40.5°C`

The thermometer says 32°C but it feels like 40.5°C!

---

```js
    const MAX_DELTA = 15;
    feels = Math.max(temp - MAX_DELTA, Math.min(temp + MAX_DELTA, feels));
```

**Clamping** — prevents unrealistic outliers. The result is forced to stay within ±15°C of the actual temperature.

`Math.min(temp + 15, feels)` — caps the maximum at `temp + 15`.
`Math.max(temp - 15, ...)` — caps the minimum at `temp - 15`.

If temp = 32°C, the result will always be between 17°C and 47°C, no matter what.

Why cap it? Sometimes extreme inputs (very high humidity + very high UV) would produce physically impossible "feels like" values like 60°C. The ±15°C cap prevents this.

---

```js
    return Math.round(feels * 10) / 10;
```

Round to 1 decimal place. See fusionEngine for the detailed math explanation of this rounding trick.

---

## Lines 49–67 — `applySmoothing()` Function

```js
export function applySmoothing(cityKey, currentTemp) {
    const prev = smoothingCache.get(cityKey);

    if (prev == null) {
        smoothingCache.set(cityKey, currentTemp);
        return currentTemp;
    }

    const diff = Math.abs(currentTemp - prev);
    if (diff > 2) {
        const smoothed = Math.round(((prev * 0.7) + (currentTemp * 0.3)) * 10) / 10;
        smoothingCache.set(cityKey, smoothed);
        return smoothed;
    }

    smoothingCache.set(cityKey, currentTemp);
    return currentTemp;
}
```

**Purpose:** Prevent jarring sudden jumps in displayed temperature between requests.

**Scenario:** Mumbai is cached at 31°C. You refresh. WeatherAPI now says 29°C (a 2°C jump due to measurement noise). Without smoothing, the dashboard jumps abruptly. With smoothing:
```
smoothed = (31 × 0.7) + (29 × 0.3) = 21.7 + 8.7 = 30.4°C
```

The display changes to 30.4°C — a smaller, gentler change.

**Step by step:**
1. `smoothingCache.get(cityKey)` → Get last recorded temp for this city.
2. If no previous record → first time this city is being tracked → save and return as-is.
3. `Math.abs(currentTemp - prev)` → How big is the jump?
4. `if (diff > 2)` → Only apply smoothing for jumps > 2°C. Small changes (≤2°C) are natural and should show immediately.
5. `(prev × 0.7) + (current × 0.3)` → Weighted toward the previous value (70%) — makes the transition gradual.
6. Save the smoothed value as the new "previous" for next time.

---

## Lines 74–84 — `realFeelDescriptor()` Function

```js
export function realFeelDescriptor(feels_like) {
    if (feels_like == null) return '';
    if (feels_like >= 45) return 'Dangerously Hot';
    if (feels_like >= 38) return 'Very Hot';
    if (feels_like >= 30) return 'Hot';
    if (feels_like >= 22) return 'Warm';
    if (feels_like >= 14) return 'Comfortable';
    if (feels_like >= 7)  return 'Cool';
    if (feels_like >= 0)  return 'Cold';
    return 'Very Cold';
}
```

Converts the numeric feels-like temperature into a human-friendly label.

The `if` chain works top-down. As soon as one condition matches, the function returns and exits — **no other checks run**. This is why the order matters: check the highest threshold first.

| Range | Label |
|---|---|
| ≥45°C | Dangerously Hot |
| ≥38°C | Very Hot |
| ≥30°C | Hot |
| ≥22°C | Warm |
| ≥14°C | Comfortable |
| ≥7°C | Cool |
| ≥0°C | Cold |
| <0°C | Very Cold |

This label appears below the feels-like temperature on the dashboard (e.g., "Feels like 39°C · Very Hot").

---

## What Happens Next

`calcRealFeel()` returns the perceived temperature number (e.g., `39.2`).
`realFeelDescriptor()` returns the label (e.g., `"Very Hot"`).
`applySmoothing()` smooths the displayed temperature between requests.

All three values are included in the final JSON sent to the browser.

---

*Next: [05_aqiHandler.md](./05_aqiHandler.md)*
