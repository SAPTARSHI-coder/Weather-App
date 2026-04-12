# 🌿 aqiHandler.js — Line by Line

> **File:** `src/weatherEngine/aqiHandler.js`
> **Job:** Take raw air quality data from WeatherAPI and convert it into a meaningful AQI number, category label, colour, emoji, and health advice.

---

## What This File Does

WeatherAPI gives you an air quality index as a category number (1 to 6). This file converts that into something humans understand: a number (like 145), a category label (like "Moderate"), a colour code, and a health tip.

**Analogy:** A hospital blood test returns a glucose level in mg/dL. The doctor converts it: "Your glucose is 180 mg/dL — that's in the 'Pre-diabetic' range. You should reduce sugar intake." This engine does the same translation for air quality.

---

## Lines 9–16 — The CPCB Breakpoints Table

```js
const CPCB_BREAKPOINTS = [
    { max: 50,       label: 'Good',         color: '#4CAF50', emoji: '🟢' },
    { max: 100,      label: 'Satisfactory', color: '#8BC34A', emoji: '🟡' },
    { max: 200,      label: 'Moderate',     color: '#FFC107', emoji: '🟠' },
    { max: 300,      label: 'Poor',         color: '#FF5722', emoji: '🔴' },
    { max: 400,      label: 'Very Poor',    color: '#9C27B0', emoji: '🔴' },
    { max: Infinity, label: 'Severe',       color: '#B71C1C', emoji: '⚫' }
];
```

`const CPCB_BREAKPOINTS` = an **array** of objects. Each object represents one AQI tier.

**CPCB** = Central Pollution Control Board of India — the Indian standard (0–500 scale).

`max: Infinity` = the last tier has no upper limit. Any AQI above 400 is "Severe". `Infinity` in JavaScript is a special value representing positive infinity — it's always larger than any number.

| AQI Range | Label | Colour |
|---|---|---|
| 0–50 | Good | 🟢 Green |
| 51–100 | Satisfactory | 🟡 Yellow-green |
| 101–200 | Moderate | 🟠 Orange |
| 201–300 | Poor | 🔴 Red-orange |
| 301–400 | Very Poor | 🔴 Purple |
| 401+ | Severe | ⚫ Dark red |

**Why is this an array?** Because we iterate through it in order. The first tier whose `max` is greater than or equal to our AQI value is the one that applies.

---

## Lines 22–25 — `epaIndexToCpcb()` Helper

```js
function epaIndexToCpcb(epaIndex) {
    const map = { 1: 25, 2: 75, 3: 150, 4: 250, 5: 350, 6: 450 };
    return map[epaIndex] ?? 50;
}
```

WeatherAPI uses the **US EPA index** (1–6) instead of a raw AQI number. This function converts it to an approximate CPCB number.

`{ 1: 25, 2: 75, ... }` = an object used as a lookup table. Keys are EPA index numbers, values are approximate CPCB equivalents.

`map[epaIndex]` = look up the EPA index in the dictionary.

`?? 50` = if the index isn't in the map (e.g., unexpected value), default to 50 (the middle of "Good").

| EPA Index | Meaning | Approximate CPCB |
|---|---|---|
| 1 | Good | 25 |
| 2 | Moderate | 75 |
| 3 | Unhealthy for Sensitive | 150 |
| 4 | Unhealthy | 250 |
| 5 | Very Unhealthy | 350 |
| 6 | Hazardous | 450 |

---

## Lines 32–39 — `categorizeAQI()` Function

```js
export function categorizeAQI(aqiValue) {
    for (const bp of CPCB_BREAKPOINTS) {
        if (aqiValue <= bp.max) {
            return { label: bp.label, color: bp.color, emoji: bp.emoji };
        }
    }
    return { label: 'Severe', color: '#B71C1C', emoji: '⚫' };
}
```

`for (const bp of CPCB_BREAKPOINTS)` = **for...of loop**. Iterates through every object in the `CPCB_BREAKPOINTS` array. Each iteration, `bp` holds one breakpoint object.

`if (aqiValue <= bp.max)` = as soon as the AQI value is ≤ the current tier's max, return that tier's info.

**Example — AQI 145:**
- bp1: max=50 → 145 ≤ 50? ❌
- bp2: max=100 → 145 ≤ 100? ❌
- bp3: max=200 → 145 ≤ 200? ✅ → return `{ label: 'Moderate', color: '#FFC107', emoji: '🟠' }`

The last `return` statement at the bottom is a safety fallback in case all tiers fail (it never should, because the last tier uses `Infinity`).

---

## Lines 44–51 — `getAQIHealthTip()` Function

```js
export function getAQIHealthTip(aqiValue) {
    if (aqiValue <= 50)  return 'Air is clean. Perfect for outdoor activities! 🌿';
    if (aqiValue <= 100) return 'Acceptable air quality. Enjoy your day.';
    if (aqiValue <= 200) return 'Moderate air. Sensitive groups should limit outdoor exertion.';
    if (aqiValue <= 300) return 'Poor air quality. Wear a mask outdoors.';
    if (aqiValue <= 400) return 'Very poor air. Avoid outdoor activities. 😷';
    return 'Hazardous air! Stay indoors and use air purifiers. 🚨';
}
```

Simple `if` chain — returns the appropriate health tip based on the AQI range.

The chain works because once a condition is met, `return` exits the function. No need for `else if` — once we return, the rest doesn't run.

**This is what appears in the AQI health tip box** on the dashboard below the AQI bar.

---

## Lines 58–63 — `resolveAQI()` Main Function

```js
export function resolveAQI(airQuality) {
    if (!airQuality) return null;
    const epaIndex = airQuality['us-epa-index'];
    if (epaIndex) return epaIndexToCpcb(epaIndex);
    return null;
}
```

`!airQuality` = "if airQuality is falsy" (null, undefined, 0, empty string). If no air quality object was provided → return null immediately.

`airQuality['us-epa-index']` = bracket notation used because the key contains hyphens (can't use dot notation with hyphens).

If `epaIndex` is truthy (a number 1–6) → convert it using `epaIndexToCpcb()` and return the CPCB number.

`return null` at the bottom = if nothing could be resolved, return null (handled gracefully by the rest of the pipeline).

---

## What Happens Next

`resolveAQI(wapiData.current.air_quality)` → returns a number like `150`.
`categorizeAQI(150)` → returns `{ label: 'Moderate', color: '#FFC107', emoji: '🟠' }`.
`getAQIHealthTip(150)` → returns the advice string.

All three are packed into the final JSON response and shown in the AQI card on the dashboard.

---

*Next: [06_confidenceCalc.md](./06_confidenceCalc.md)*
