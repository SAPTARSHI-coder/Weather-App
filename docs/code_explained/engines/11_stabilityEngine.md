# ⚖️ stabilityEngine.js — Line by Line

> **File:** `src/weatherEngine/stabilityEngine.js`
> **Job:** Look at the historical readings buffer and calculate how much the weather has been fluctuating. Classify it as Stable, Fluctuating, or Volatile.

---

## What This File Does

Some days the temperature barely moves — 28°C all day. Other days it swings wildly — 24°C in the morning, 36°C in the afternoon, 27°C by evening. This engine measures that "swing" using statistical variance.

**Analogy:** Measuring the smoothness of a road by recording how many bumps you hit per kilometer. A smooth highway → Stable. A country road with occasional bumps → Fluctuating. Off-road rocks everywhere → Volatile.

---

## Lines 12–16 — `variance()` Helper Function

```js
function variance(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}
```

**Statistical variance** measures how spread out a set of numbers are from their average.

**Step by step with example: `[28, 32, 29, 35, 31, 30]`**

**Step 1 — Calculate the mean (average):**
```
mean = (28 + 32 + 29 + 35 + 31 + 30) / 6 = 185 / 6 = 30.83
```

`values.reduce((a, b) => a + b, 0)` = sums all values. Then `/ values.length` divides by count.

**Step 2 — Calculate variance:**
```
For each value, compute: (value - mean)²
(28 - 30.83)² = (-2.83)² = 8.01
(32 - 30.83)² = (1.17)² = 1.37
(29 - 30.83)² = (-1.83)² = 3.35
(35 - 30.83)² = (4.17)² = 17.39
(31 - 30.83)² = (0.17)² = 0.03
(30 - 30.83)² = (-0.83)² = 0.69

Sum = 8.01 + 1.37 + 3.35 + 17.39 + 0.03 + 0.69 = 30.84
Variance = 30.84 / 6 = 5.14
```

`.reduce((sum, v) => sum + (v - mean) ** 2, 0)` — This computes and sums the squared differences.

`(v - mean) ** 2` = squared difference. We square it so that negative differences don't cancel positive ones — variance measures magnitude of spread, not direction.

`/ values.length` = divide by count to get the average squared difference = **population variance**.

High variance = values are spread far from the mean = unstable weather.
Low variance = values cluster near the mean = stable weather.

---

## Lines 29–61 — `calcStability()` Main Function

```js
export function calcStability(buffer) {
    if (buffer.length < 2) {
        return {
            stability: 'Stable',
            temp_variance: 0,
            pressure_variance: 0,
            stability_score: 0
        };
    }
```

`buffer` = the raw array of readings from `trendEngine.getBuffer()`.

`buffer.length < 2` — Need at least 2 readings to compute variance (can't measure spread with 1 point). Return defaults with `stability: 'Stable'` — we assume stable until proven otherwise.

---

```js
    const temps      = buffer.map(e => e.temp       ?? 0);
    const pressures  = buffer.map(e => e.pressure_mb ?? 1013);
    const humidities = buffer.map(e => e.humidity    ?? 50);
```

`.map()` extracts one specific field from each buffer entry into a plain number array.
`?? 0` / `?? 1013` / `?? 50` = use defaults for missing values.

So after this, `temps` might be `[28, 29, 31, 35, 33, 30]` — just the temperatures.

---

```js
    const tempVar  = variance(temps);
    const pressVar = variance(pressures);
    const humVar   = variance(humidities);
```

Calculate variance for each of the three metrics using our helper function.

---

```js
    const score = (tempVar * 2) + (pressVar * 0.05) + (humVar * 0.3);
```

**The composite stability score:**

| Variable | Weight | Why |
|---|---|---|
| `tempVar * 2` | Highest | Temperature swings are the most humanly noticeable instability |
| `pressVar * 0.05` | Lowest | Pressure varies in large numbers (e.g., 1008 to 1020) even normally — raw variance would be huge, so heavy downweighting |
| `humVar * 0.3` | Medium | Humidity swings matter, but less than temperature |

**Example:**
- `tempVar = 5.14` × 2 → 10.28
- `pressVar = 18.2` × 0.05 → 0.91
- `humVar = 8.5` × 0.3 → 2.55
- `score = 13.74` → Volatile

---

```js
    let stability;
    if (score < 1.5)    stability = 'Stable';
    else if (score < 6) stability = 'Fluctuating';
    else                stability = 'Volatile';
```

**Classification thresholds:**

| Score | Classification | Meaning for user |
|---|---|---|
| < 1.5 | Stable | Comfortable — predictable weather |
| 1.5–5.9 | Fluctuating | Some variation — carry an umbrella just in case |
| ≥ 6 | Volatile | Rapidly changing — difficult to predict |

These thresholds are calibrated for real-world temperature variance:
- A perfectly constant day → variance ≈ 0 → Stable
- A normal day with 3–5°C diurnal swing → variance ≈ 2–4 → Fluctuating
- A stormy/extreme day → variance ≈ 8+ → Volatile

---

```js
    return {
        stability,
        temp_variance:     Math.round(tempVar  * 100) / 100,
        pressure_variance: Math.round(pressVar * 100) / 100,
        stability_score:   Math.round(score    * 100) / 100
    };
```

Returns 4 values, all rounded to 2 decimal places.

The `temp_variance` and `pressure_variance` are included for transparency — the dashboard can display them as technical details.

---

## What Happens Next

```json
{
    "stability": "Fluctuating",
    "temp_variance": 3.21,
    "pressure_variance": 2.45,
    "stability_score": 8.05
}
```

The **Stability** section of the Intelligence Panel shows the label ("Fluctuating ⚡") and optionally the score. It helps users understand whether the weather today is trustworthy or erratic.

---

*Next: [12_insightEngine.md](./12_insightEngine.md)*
