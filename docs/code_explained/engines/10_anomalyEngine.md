# 🚨 anomalyEngine.js — Line by Line

> **File:** `src/weatherEngine/anomalyEngine.js`
> **Job:** Detect dangerous, unusual, or extreme weather changes and fire warnings — using the trend slopes as the signal.

---

## What This File Does

Most weather is boring. But sometimes temperature surges by 5°C in an hour, pressure plummets, AQI spikes, or fog rolls in suddenly. This engine watches for those sudden dangerous changes and raises a flag.

**Analogy:** A security alarm system. Most of the time, nothing triggers it. But if a door opens at 3am, or a window breaks — ALERT. This engine is that alarm system for the atmosphere.

---

## Lines 14–21 — Function Signature and Early Exit

```js
export function detectAnomalies(trends, fused) {
    const anomalies = [];
    const { temp_trend, pressure_trend, aqi_trend, humidity_trend, visibility_trend, buffer_size } = trends;

    if (buffer_size < 2) {
        return { anomalies: [], severity: 'none' };
    }
```

Two inputs:
- `trends` — slopes from `trendEngine.getTrends()`
- `fused` — current merged weather snapshot

`const anomalies = []` — Empty array. Anomaly strings will be added here.

**Destructuring** — pulls out all 6 trend values from the trends object in one line.

`if (buffer_size < 2)` — If we have only 1 reading, we can't have a "rate of change" — there's nothing to compare to. Return immediately with no anomalies. This prevents false alarms at startup.

---

## Lines 23–32 — Temperature Anomalies

```js
    if (temp_trend > 4) {
        anomalies.push('🌡️ Extreme temperature surge detected');
    } else if (temp_trend > 2.5) {
        anomalies.push('🌡️ Temperature rising rapidly');
    } else if (temp_trend < -4) {
        anomalies.push('❄️ Severe temperature plunge');
    } else if (temp_trend < -2.5) {
        anomalies.push('❄️ Temperature dropping sharply');
    }
```

`temp_trend` = °C per hour (from linear regression).

**Thresholds:**
- `> 4°C/hour` = extreme. This would mean temperature shoots from 28°C to 36°C in 2 hours — extremely unusual.
- `> 2.5°C/hour` = rapid but less extreme.
- `< -4°C/hour` = severe cold plunge.
- `< -2.5°C/hour` = sharp cooling.

Normal temperature changes are under 1°C/hour in most climates. Above 2.5°C/hour is noteworthy; above 4°C/hour is alarming.

Note: Multiple anomalies CAN be added during one call — e.g., temperature AND pressure AND AQI anomalies can all fire simultaneously. Unlike the rain engine which uses `else if`, here we use separate `if` statements because multiple different types can coexist.

---

## Lines 34–39 — Pressure Anomalies

```js
    if (pressure_trend < -3) {
        anomalies.push('⛈️ Extreme pressure drop — storm imminent');
    } else if (pressure_trend < -1.5) {
        anomalies.push('💨 Sharp pressure drop — storm risk rising');
    }
```

Pressure is measured in hPa (hectopascals). Normal pressure is around 1013 hPa.

- `< -3 hPa/hour` = dramatic plunge. Meteorologists consider a drop of >6 hPa in 3 hours a sign of rapid storm development. At -3/hour, we're at that threshold.
- `< -1.5 hPa/hour` = significant drop.

No upward pressure anomaly — rising pressure means clearing weather (a good thing, not an anomaly).

---

## Lines 41–46 — AQI Anomalies

```js
    if (aqi_trend > 50) {
        anomalies.push('🏭 Sudden severe pollution spike');
    } else if (aqi_trend > 20) {
        anomalies.push('🏭 Air quality deteriorating rapidly');
    }
```

`aqi_trend` = AQI points per hour (from trendEngine).

- `> 50 AQI/hour` = catastrophic spike. Could indicate a nearby factory accident, wildfire starting, or car accident releasing pollutants.
- `> 20 AQI/hour` = rapid deterioration. Normal rush-hour pollution rises at ~5–10 AQI/hour.

---

## Lines 48–53 — Visibility Anomalies

```js
    if ((fused.visibility ?? 10) < 1) {
        anomalies.push('🌫️ Near-zero visibility — dense fog');
    } else if (visibility_trend < -3 && (fused.visibility ?? 10) < 4) {
        anomalies.push('🌫️ Visibility falling fast — fog developing');
    }
```

`fused.visibility ?? 10` — If visibility is null, assume 10km (clear). The `??` prevents a crash.

`(fused.visibility ?? 10) < 1` — Current visibility is under 1km. This is dense fog, regardless of trend — even with 0 historical data, this is dangerous.

`visibility_trend < -3 && (fused.visibility ?? 10) < 4` — Both conditions must be true (`&&` = AND):
- Visibility falling at more than 3km/hour
- AND currently already below 4km

This combination means fog is developing rapidly and conditions are already poor.

---

## Lines 55–58 — Humidity Surge

```js
    if (humidity_trend > 8) {
        anomalies.push('💧 Rapid humidity surge');
    }
```

`> 8% per hour` = a sharp jump. Normal humidity shifts are 1-3% per hour. A jump of 8%+ often signals a nearby rain event or sudden sea breeze carrying moisture.

---

## Lines 60–70 — Severity Mapping

```js
    let severity = 'none';
    if (anomalies.length >= 3 ||
        temp_trend > 4 || temp_trend < -4 ||
        pressure_trend < -3) {
        severity = 'critical';
    } else if (anomalies.length >= 1) {
        severity = 'warning';
    }

    return { anomalies, severity };
```

Any anomaly promotes severity to `'warning'`. Extreme conditions (3+ anomalies, or extreme temperature/pressure specifically) promote to `'critical'`.

`anomalies.length >= 3` — Three or more simultaneous anomalies = something very wrong.
`temp_trend > 4` / `pressure_trend < -3` — Extreme thresholds that always mean critical even if alone.

**Severity is used by the frontend** to decide the banner color:
- `'none'` → no banner shown
- `'warning'` → orange banner
- `'critical'` → red pulsing banner

---

## What Happens Next

```json
{
    "anomalies": ["⛈️ Extreme pressure drop — storm imminent", "💧 Rapid humidity surge"],
    "severity": "critical"
}
```

The anomaly banner (`#anomaly-banner`) appears on the dashboard with the first anomaly message and a red/orange colour depending on severity.

---

*Next: [11_stabilityEngine.md](./11_stabilityEngine.md)*
