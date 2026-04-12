# 🌧️ rainEngine.js — Line by Line

> **File:** `src/weatherEngine/rainEngine.js`
> **Job:** Score how likely it is to rain, based on multiple weather factors. Return a category (Low/Medium/High) and explain the reasons why.

---

## What This File Does

No single sensor says "rain probability = 72%." Instead, you combine clues: Is the humidity high? Is the pressure dropping? Are the clouds thick? Is visibility poor? Is it already raining? Add up all the clues — that's your rain probability score.

**Analogy:** A detective doesn't have one piece of evidence that proves guilt. They accumulate multiple clues — motive, fingerprints, witness statements, timeline — and score the total evidence. This engine is that detective, for rain.

---

## Lines 16–18 — Function Signature and Initial State

```js
export function calcRainProbability(humidity, pressure_trend, cloud, visibility, precip_mm = 0) {
    let score = 0;
    const factors = [];
```

Five inputs:
- `humidity` — relative humidity percentage
- `pressure_trend` — slope from trendEngine (negative = falling pressure)
- `cloud` — cloud cover percentage
- `visibility` — how far you can see in km
- `precip_mm = 0` — current precipitation. Default is 0 (default parameter).

`let score = 0` — We'll add points to this score as each factor is evaluated.

`const factors = []` — An empty array. We'll push human-readable strings into it explaining what contributed to the score. These appear in the "Rain Factors" list on the Intelligence Panel.

---

## Lines 20–33 — Humidity Scoring

```js
    if (humidity >= 90) {
        score += 4;
        factors.push('Very high humidity (≥90%)');
    } else if (humidity >= 80) {
        score += 3;
        factors.push('High humidity (≥80%)');
    } else if (humidity >= 70) {
        score += 2;
        factors.push('Elevated humidity (≥70%)');
    } else if (humidity >= 55) {
        score += 1;
        factors.push('Moderate humidity');
    }
```

`score += 4` = "add 4 to score." Same as `score = score + 4`.

`factors.push('...')` = adds a string to the end of the `factors` array.

**Why humidity?** High humidity means the air is nearly saturated with water vapour. Rain forms when air reaches 100% relative humidity. So high humidity is a strong rain predictor.

**Points assigned:**
- ≥90% humidity → 4 points (very rain-prone)
- ≥80% → 3 points
- ≥70% → 2 points
- ≥55% → 1 point
- <55% → 0 points (not humid enough to predict rain)

The `else if` chain ensures ONLY ONE block runs (the most applicable one). If humidity is 92%, only the first block runs (4 points) — not also the 80% block.

---

## Lines 35–45 — Pressure Trend Scoring

```js
    if (pressure_trend < -2) {
        score += 4;
        factors.push('Sharp pressure drop (storm risk)');
    } else if (pressure_trend < -1) {
        score += 3;
        factors.push('Pressure dropping quickly');
    } else if (pressure_trend < -0.3) {
        score += 2;
        factors.push('Pressure falling');
    }
```

**Why pressure?** Atmospheric pressure drops when warm, moist air is rising (a low-pressure system). Rising warm air cools, water vapour condenses, clouds form, rain falls. Dropping pressure = incoming rain.

`pressure_trend` values are in hPa/hour (Pascals per hour — the pressure unit):
- `< -2` hPa/hour = dramatic drop → storm risk
- `< -1` hPa/hour = significant drop
- `< -0.3` hPa/hour = gradual fall

Note: There's no score for stable or rising pressure (no block for `> 0`) — rising pressure means clearing weather, so it contributes 0 to rain score.

---

## Lines 47–57 — Cloud Cover Scoring

```js
    if (cloud >= 85) {
        score += 3;
        factors.push('Heavy cloud cover (≥85%)');
    } else if (cloud >= 70) {
        score += 2;
        factors.push('Significant cloud cover');
    } else if (cloud >= 50) {
        score += 1;
        factors.push('Partly cloudy');
    }
```

**Why cloud cover?** Rain can't fall without clouds. 85%+ cloud cover means nearly the entire sky is overcast — rainclouds are thick and covering. Under 50% cloud cover, rain is unlikely.

Maximum 3 points from cloud cover (less than humidity or pressure — cloud cover alone doesn't guarantee rain).

---

## Lines 59–66 — Visibility Scoring

```js
    if (visibility < 2) {
        score += 2;
        factors.push('Very low visibility');
    } else if (visibility < 5) {
        score += 1;
        factors.push('Reduced visibility');
    }
```

**Why visibility?** Poor visibility means the air is thick with moisture (fog, mist, haze, or rain droplets). Under 2km visibility often accompanies heavy rain or dense fog — both rain precursors or accompaniments.

---

## Lines 68–72 — Active Precipitation Bonus

```js
    if (precip_mm > 0.5) {
        score += 3;
        factors.push('Active precipitation detected');
    }
```

This is the most obvious signal — it's **already raining**. If `precip_mm > 0.5` (more than half a millimetre of rain measured), add 3 points immediately.

`0.5mm` threshold avoids noise — very tiny values might be measurement error or dew.

---

## Lines 74–81 — Scoring and Return

```js
    let rain_probability;
    if (score >= 7)      rain_probability = 'High';
    else if (score >= 4) rain_probability = 'Medium';
    else                 rain_probability = 'Low';

    return { rain_probability, rain_score: score, rain_factors: factors };
```

**Category thresholds:**

| Score | Category | Meaning |
|---|---|---|
| 7+ | High | Multiple strong rain signals |
| 4–6 | Medium | Some signals but not definitive |
| 0–3 | Low | Little evidence of rain |

Maximum possible score = 4 (humidity) + 4 (pressure) + 3 (cloud) + 2 (visibility) + 3 (precipitation) = **16 points**.

A score of 7 = 44% of the maximum — this threshold is set conservatively to avoid false alarms.

`return { rain_probability, rain_score: score, rain_factors: factors }` — Shorthand property notation (when variable name equals key name). Returns all three values as one object.

---

## What Happens Next

```json
{
    "rain_probability": "Medium",
    "rain_score": 5,
    "rain_factors": ["High humidity (≥80%)", "Pressure falling", "Partly cloudy"]
}
```

This populates the **"Rain Chance"** section in the Intelligence Panel. The badge shows "Medium 🌦️" and the factors list explains why.

---

*Next: [10_anomalyEngine.md](./10_anomalyEngine.md)*
