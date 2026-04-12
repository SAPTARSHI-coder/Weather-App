# 🔮 predictionEngine.js — Line by Line

> **File:** `src/weatherEngine/predictionEngine.js`
> **Job:** Use the current weather data plus the trend slopes to predict what weather will look like ONE HOUR from now.

---

## What This File Does

If the temperature is 28°C and it's been rising at 1.5°C/hour for the last hour, we can predict it will be around 29.5°C in one hour. Add some real-world randomness, and we also predict the *condition* ("Possible Rain", "Fog Likely", etc.).

**Analogy:** A train is at station A (28°C) and travelling at a certain speed (trend). You can predict where it will be in 1 hour. If it speeds up or slows down slightly (random factor), the estimate adjusts. But you never predict it teleporting 100 miles away.

---

## Lines 11–17 — `trendLabel()` Helper

```js
export function trendLabel(slope) {
    if (slope > 1.5)  return '↑↑ Rapidly Rising';
    if (slope > 0.3)  return '↑ Rising';
    if (slope < -1.5) return '↓↓ Rapidly Falling';
    if (slope < -0.3) return '↓ Falling';
    return '→ Stable';
}
```

Converts a number (slope from trendEngine) into a human-readable direction label.

- `slope > 1.5` = rising by more than 1.5°C/hour → "Rapidly Rising"
- `slope > 0.3` = rising (but under 1.5°C/hour) → "Rising"
- `slope < -1.5` = dropping fast → "Rapidly Falling"
- `slope < -0.3` = dropping slowly → "Falling"
- Default (between -0.3 and 0.3) → "Stable"

**Why 0.3?** Less than 0.3°C/hour is imperceptible hour-to-hour. Not worth calling it a trend.

Unicode arrows (`↑↑ ↑ ↓↓ ↓ →`) display directly in the browser — no special fonts needed.

---

## Lines 31–51 — `predictNextHour()` — Start & Defaults

```js
export function predictNextHour(fused, trends) {
    const temp       = fused.temp        ?? 20;
    const humidity   = fused.humidity    ?? 50;
    const cloud      = fused.cloud       ?? 0;
    const visibility = fused.visibility  ?? 10;
    const pressure   = fused.pressure_mb ?? 1013;
    const aqi        = fused.aqi         ?? 0;

    const { temp_trend, humidity_trend, pressure_trend, buffer_size } = trends;
```

All fields use `??` (nullish coalescing) with sensible defaults:
- `temp ?? 20` → assume 20°C if unknown (mild)
- `humidity ?? 50` → assume 50% (comfortable)
- `pressure ?? 1013` → standard sea-level pressure
- `aqi ?? 0` → assume clean air

**Destructuring from trends:**
`const { temp_trend, humidity_trend, pressure_trend, buffer_size } = trends;`
— Unpacks the 5 slope values from the trends object returned by `getTrends()`.

---

## Lines 42–50 — Predicted Temperature

```js
    const randomFactor = 0.8 + (Math.random() * 0.4);
    const variance = temp_trend * randomFactor;

    const clamped_variance = Math.max(-3, Math.min(3, variance));
    const raw_predicted = temp + clamped_variance;

    const predicted_temp = Math.round(raw_predicted * 10) / 10;
```

**Step by step:**

`Math.random()` = returns a random decimal between 0 (inclusive) and 1 (exclusive).
`0.8 + (Math.random() * 0.4)` = gives a random number between **0.8 and 1.2**.

**Why add randomness?**
Weather is not perfectly linear. A trend of +1.5°C/hour might actually materialise as +1.2°C or +1.7°C in the next hour. The random factor (±20%) models this real-world uncertainty.

`variance = temp_trend * randomFactor`:
- If trend = +1.5, random = 1.1 → variance = +1.65
- If trend = +1.5, random = 0.9 → variance = +1.35

`Math.max(-3, Math.min(3, variance))` = **clamping**. Never predict more than ±3°C change in one hour. Real-world weather doesn't swing more than 3°C per hour (outside of extreme storm events).

`raw_predicted = temp + clamped_variance` — Add the expected change to current temperature.

`Math.round(raw_predicted * 10) / 10` — Round to 1 decimal (as discussed in fusionEngine).

---

## Lines 52–71 — Predicted Condition

```js
    let predicted_condition = fused.condition ?? 'Clear';

    if (pressure_trend < -1.5 && humidity > 65) {
        predicted_condition = 'Possible Rain';
    } else if (humidity > 85 && visibility < 3) {
        predicted_condition = 'Fog Likely';
    } else if (temp_trend > 1.5 && humidity > 70) {
        predicted_condition = 'Hot & Humid';
    } else if (temp_trend < -1 && humidity_trend > 1) {
        predicted_condition = 'Cooling — Moisture Building';
    } else if (cloud > 75 && pressure_trend < -0.5) {
        predicted_condition = 'Overcast & Unsettled';
    } else if (aqi > 150 && temp_trend > 0.5) {
        predicted_condition = 'Warm & Polluted';
    } else if (temp_trend > 0.5) {
        predicted_condition = 'Warming Up';
    } else if (temp_trend < -0.5) {
        predicted_condition = 'Cooling Down';
    }
```

`let` (not `const`) — because this might be reassigned below.

`fused.condition ?? 'Clear'` — Start with the current condition as default. If the data doesn't trigger any rule below, the prediction is "more of the same."

**The if-else if chain** — Each condition is checked in order. The first matching rule sets the prediction. Using `else if` means only ONE condition will be set (unlike separate `if` statements that all run).

**Rule logic explained:**

| Rule | Meaning |
|---|---|
| `pressure_trend < -1.5 && humidity > 65` | Pressure dropping fast + humid air → storm/rain incoming |
| `humidity > 85 && visibility < 3` | Dense moist air + poor visibility → fog likely |
| `temp_trend > 1.5 && humidity > 70` | Rising heat + high humidity → uncomfortable conditions |
| `temp_trend < -1 && humidity_trend > 1` | Cooling but moisture rising → transition weather |
| `cloud > 75 && pressure_trend < -0.5` | Heavy clouds + falling pressure → unstable overcast |
| `aqi > 150 && temp_trend > 0.5` | Pollution + warming → smog build-up conditions |

---

## Lines 73–78 — Prediction Confidence

```js
    let prediction_confidence;
    if (buffer_size >= 5)      prediction_confidence = 'High';
    else if (buffer_size >= 3) prediction_confidence = 'Medium';
    else if (buffer_size >= 2) prediction_confidence = 'Low';
    else                       prediction_confidence = 'Calculating…';
```

The quality of a prediction depends on how many historical data points went into the trend calculation:

| Buffer Size | Confidence | Why |
|---|---|---|
| 5–6 readings | High | ~50 min of history — reliable slope |
| 3–4 readings | Medium | ~30 min — decent slope |
| 2 readings | Low | Only one "step" — rough estimate |
| <2 readings | Calculating | Not enough data yet |

---

## Lines 80–85 — Return Object

```js
    return {
        predicted_temp,
        predicted_condition,
        temp_direction: trendLabel(temp_trend),
        prediction_confidence
    };
```

Returns 4 fields:
- `predicted_temp` — e.g., `29.5` (number)
- `predicted_condition` — e.g., `"Possible Rain"` (string)
- `temp_direction` — e.g., `"↑ Rising"` (from `trendLabel()`)
- `prediction_confidence` — e.g., `"High"` (string)

---

## What Happens Next

These 4 values populate the **"Next Hour Prediction"** section in the Intelligence Panel on the dashboard.

---

*Next: [09_rainEngine.md](./09_rainEngine.md)*
