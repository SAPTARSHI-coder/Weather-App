# 🌤️ conditionEngine.js — Line by Line

> **File:** `src/weatherEngine/conditionEngine.js`
> **Job:** Look at the raw weather numbers (humidity, temperature, cloud cover, UV) and decide WHAT the condition actually is — in words and emoji.

---

## What This File Does

WeatherAPI gives you a condition label like "Partly Cloudy" — but it's from their server, and sometimes it doesn't match the real numbers. For example, their API might say "Clear" when visibility is 0.3km (dense fog). This engine derives the condition **itself** from the actual data, using a strict priority system.

**Analogy:** A doctor doesn't just read the patient's self-reported symptoms. They look at blood pressure, temperature, and X-rays and form their **own** conclusion. This engine is the doctor.

---

## Lines 17–18 — Function Signature

```js
export function deriveCondition(fused) {
    const { temp, humidity, visibility, cloud, wind_kph, uv, is_day } = fused;
```

**Destructuring** — Instead of writing `fused.temp`, `fused.humidity` etc. every time, we unpack them all into individual variables in one line. The `{ }` on the right of `=` means "extract these named fields from the object."

`is_day` — a number: `1` = daytime, `0` = night. Used to show "Clear" vs "Clear Night".

---

```js
    const rawCondition = (fused._raw_condition || '').toLowerCase();
```

`fused._raw_condition` = the condition text string from WeatherAPI (e.g., `"Partly Cloudy"` or `"Heavy Rain"`). This is attached by `server.js` before calling this engine.

`|| ''` — If it's null or undefined, use an empty string instead (so `.toLowerCase()` doesn't crash).

`.toLowerCase()` — Converts to lowercase. Makes checking easier — `"Rain"`, `"rain"`, `"RAIN"` all become `"rain"`.

---

## Lines 21–30 — Priority 1: Precipitation

```js
    if (rawCondition.includes('thunder') || rawCondition.includes('storm')) {
        return { condition: 'Thunderstorm', emoji: '⛈️' };
    }
    if (rawCondition.includes('snow') || rawCondition.includes('blizzard') || rawCondition.includes('sleet')) {
        return { condition: 'Snow', emoji: '❄️' };
    }
    if (rawCondition.includes('rain') || rawCondition.includes('drizzle')) {
        return { condition: 'Rain', emoji: '🌧️' };
    }
```

`String.includes('text')` = returns `true` if the string contains that text anywhere.

`||` = OR. If EITHER condition is true, the whole thing is true.

`return` inside an `if` block = exits the function immediately with that value. No further checks run.

**Why trust the API for precipitation?** Because detecting rain/snow requires actual precipitation sensors. Our numeric-based rules can't detect falling water — only the API knows from its ground station. So for these cases, we defer to the API's label.

**Priority order** matters. Thunder is checked before rain because a thunderstorm is also rainy — we want the more specific label.

---

## Lines 32–43 — Priority 2: Fog Detection from Numbers

```js
    if (humidity != null && visibility != null) {
        if (humidity > 80 && visibility < 3) {
            return { condition: 'Fog', emoji: '🌫️' };
        }
        if (humidity > 65 && visibility < 6) {
            return { condition: 'Hazy', emoji: '🌁' };
        }
        if (humidity > 75 && visibility < 5) {
            return { condition: 'Mist', emoji: '🌫️' };
        }
    }
```

`!= null` = "is not null AND is not undefined" (the `!=` with one `=` checks for both null and undefined).

This is the key innovation — we derive fog conditions from **numbers** rather than trusting the API's label. If humidity is very high (>80%) AND visibility is very low (<3km), it's fog — regardless of what the API says.

**The logic:**
- `humidity > 80 && visibility < 3` → Dense Fog (both conditions must be met — `&&` = AND)
- `humidity > 65 && visibility < 6` → Hazy (less extreme)
- `humidity > 75 && visibility < 5` → Mist (medium)

---

## Lines 45–48 — Priority 3: Harsh Sun from UV

```js
    if (uv != null && uv > 8 && is_day) {
        return { condition: 'Harsh Sun', emoji: '🔆' };
    }
```

`uv > 8` = UV index above 8 = "Very High" danger level.
`is_day` = truthy check (`1` = truthy, `0` = falsy). We only call it "Harsh Sun" if it's actually daytime.

No existing weather app labels a condition as "Harsh Sun" — this is a unique SkyGlass feature. A UV of 9+ on a clear summer day genuinely warrants special warning.

---

## Lines 50–66 — Priority 4 & 5: Temperature and Cloud

```js
    if (temp != null) {
        if (temp < 5) return { condition: 'Cold', emoji: '🥶' };
        if (temp > 34 && wind_kph != null && wind_kph < 8) {
            return { condition: 'Hot', emoji: '🌡️' };
        }
    }

    if (cloud != null) {
        if (cloud > 75) return { condition: 'Overcast', emoji: '☁️' };
        if (cloud > 60) return { condition: 'Cloudy', emoji: '🌥️' };
        if (cloud > 25) return { condition: is_day ? 'Partly Cloudy' : 'Partly Cloudy Night', emoji: '⛅' };
    }

    return { condition: is_day ? 'Clear' : 'Clear Night', emoji: is_day ? '☀️' : '🌙' };
```

**Temperature rules:**
- `temp < 5` → "Cold" (below 5°C is genuinely cold)
- `temp > 34 && wind_kph < 8` → "Hot" — only labelled hot if there's little wind. Strong wind makes hot weather feel bearable.

**Cloud rules:**
- `> 75%` → Overcast (nearly fully clouded)
- `> 60%` → Cloudy
- `> 25%` → Partly Cloudy (daytime) or Partly Cloudy Night

**Ternary in last line:**
`is_day ? 'Clear' : 'Clear Night'` = if daytime → 'Clear', otherwise → 'Clear Night'. Same pattern for the emoji.

**This is the default** — if none of the above rules match, it's clear sky.

---

## Lines 72–85 — `conditionToIcon()` Function

```js
export function conditionToIcon(condition) {
    const c = condition.toLowerCase();
    if (c.includes('thunder')) return 'ri-thunderstorms-fill';
    if (c.includes('snow') || c.includes('blizzard')) return 'ri-snowflake-fill';
    if (c.includes('rain') || c.includes('drizzle')) return 'ri-heavy-showers-fill';
    if (c.includes('fog') || c.includes('hazy')) return 'ri-foggy-fill';
    if (c.includes('mist')) return 'ri-mist-fill';
    if (c.includes('overcast')) return 'ri-cloudy-fill';
    if (c.includes('cloudy')) return 'ri-cloudy-2-fill';
    if (c.includes('cold')) return 'ri-temp-cold-fill';
    if (c.includes('hot') || c.includes('harsh')) return 'ri-temp-hot-fill';
    if (c.includes('night')) return 'ri-moon-clear-fill';
    return 'ri-sun-fill';  // default
}
```

A second function in this file that maps our condition strings (like `"Fog"`) to RemixIcon class names (like `"ri-foggy-fill"`).

`ri-` prefix = RemixIcon. These are CSS classes that display icon fonts. JavaScript uses this string to update the `className` of the big icon element on the dashboard.

`return 'ri-sun-fill'` at the bottom = default icon if no condition matches (sunny).

---

## What Happens Next

`deriveCondition(fused)` returns `{ condition: "Partly Cloudy", emoji: "⛅" }`.
`conditionToIcon("Partly Cloudy")` returns `"ri-cloudy-2-fill"`.

Both are included in the final JSON response sent to the browser, which updates the condition label and the big icon on the hero card.

---

*Next: [04_realFeelEngine.md](./04_realFeelEngine.md)*
