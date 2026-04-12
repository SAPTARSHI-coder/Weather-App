# 🔒 confidenceCalc.js — Line by Line

> **File:** `src/weatherEngine/confidenceCalc.js`
> **Job:** Score how reliable the fused weather data is, based on how many sources were used and how much they disagreed.

---

## What This File Does

If both weather sources agreed perfectly (32°C from both), the data is highly reliable. If one said 32°C and the other said 26°C, something is wrong — lower reliability. This engine scores and labels that reliability.

**Analogy:** Two doctors diagnose a patient. If both say "appendicitis" — high confidence. If one says "appendicitis" and the other says "indigestion" — low confidence. Get a third opinion.

---

## Lines 12–51 — `calculateConfidence()` Function

```js
export function calculateConfidence(tempDiff, sourcesUsed) {
```

Two inputs:
- `tempDiff` = how many degrees the two sources disagreed (e.g., `2.3`)
- `sourcesUsed` = how many sources were actually used (1 or 2)

---

### Case 1 — Only One Source

```js
    if (sourcesUsed < 2) {
        return {
            level: 'Low',
            label: 'Single Source',
            color: '#ef4444',
            icon: '🔴',
            reason: 'Only one source available — secondary source unavailable'
        };
    }
```

`sourcesUsed < 2` = only one source was used (fusionEngine discarded Open-Meteo as an outlier, or it failed).

Returns an object with 5 fields:
- `level` = the internal code (`'Low'`)
- `label` = display text (`'Single Source'`)
- `color` = hex colour for the badge (`'#ef4444'` = red)
- `icon` = emoji prefix (`'🔴'`)
- `reason` = human-readable explanation

---

### Case 2 — High Confidence

```js
    if (tempDiff < 2) {
        return {
            level: 'High',
            label: 'High Confidence',
            color: '#22c55e',
            icon: '🟢',
            reason: `Sources aligned (±${tempDiff.toFixed(1)}°C variance)`
        };
    }
```

`tempDiff < 2` = both sources agree within 2°C (e.g., WeatherAPI says 32°C, Open-Meteo says 31.3°C).

Template literal in `reason`:
``` 
`Sources aligned (±${tempDiff.toFixed(1)}°C variance)`
```
- Backtick strings (`` ` ``) allow embedding expressions with `${}`.
- `tempDiff.toFixed(1)` = round to 1 decimal. E.g., `1.837` → `"1.8"`.
- Output: `"Sources aligned (±1.8°C variance)"`

`'#22c55e'` = green colour. This is the badge colour on the dashboard.

---

### Case 3 — Medium Confidence

```js
    if (tempDiff <= 5) {
        return {
            level: 'Medium',
            label: 'Medium Confidence',
            color: '#f59e0b',
            icon: '🟡',
            reason: `Moderate variance between sources (±${tempDiff.toFixed(1)}°C)`
        };
    }
```

`tempDiff <= 5` = disagreement between 2°C and 5°C. Sources don't perfectly agree, but they're close enough to use both.

`'#f59e0b'` = amber/yellow colour.

---

### Case 4 — Low Confidence (fallback)

```js
    return {
        level: 'Low',
        label: 'Low Confidence',
        color: '#ef4444',
        icon: '🔴',
        reason: `High variance detected between sources (±${tempDiff.toFixed(1)}°C)`
    };
```

This runs only if `tempDiff > 5` — BUT recall that in `fusionEngine.js`, when `tempDiff > 5`, the secondary source is already discarded as an outlier and `sourcesUsed` will be 1. So this last branch would trigger the "Single Source" case instead.

In practice, this bottom `return` acts as a safety net for edge cases.

---

## Summary of Logic

```
sourcesUsed < 2       → 🔴 Low   (Single Source)
tempDiff < 2          → 🟢 High  (Sources aligned)
2 ≤ tempDiff ≤ 5      → 🟡 Medium (Moderate variance)
tempDiff > 5          → 🔴 Low   (High variance)
```

---

## What Happens Next

`calculateConfidence(fused.temp_diff, fused.sources_used.length)` is called in `server.js`.

The returned object is included in the final JSON:
```json
{
    "confidence_label": "High Confidence",
    "confidence_icon": "🟢",
    "sources_count": 2
}
```

This powers the small confidence badge on the dashboard hero card.

---

*Next: [07_trendEngine.md](./07_trendEngine.md)*
