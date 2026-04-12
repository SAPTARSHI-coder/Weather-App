# 🧠 normalizer.js — Line by Line

> **File:** `src/weatherEngine/normalizer.js`
> **Job:** Translate two completely different API responses into one common format so the rest of the system can work with a single, predictable structure.

---

## What This File Does

WeatherAPI and Open-Meteo both give you weather data — but they package it differently. It's like two doctors writing the same patient's temperature — one writes "temp_c: 32" and the other writes "temperature_2m[0]: 32". The Normalizer reads both formats and rewrites them into one standard form (called a "Canonical Snapshot").

**Analogy:** A universal power adapter. Your charger plug might be Type A, and the wall socket might be Type B. The adapter makes both work together. The Normalizer is that adapter.

---

## Lines 1–5 — Comment Block

```js
/**
 * Normalizer Module
 * Converts raw API responses from WeatherAPI and Open-Meteo into
 * a unified WeatherSnapshot schema.
 */
```

This is a **JSDoc comment** (multi-line comment starting with `/**`). It explains what the file does. It doesn't run as code — it's documentation for the developer. The `*` at the start of each line is optional but conventional.

---

## Lines 12–48 — `normalizeWeatherAPI()` Function

```js
export function normalizeWeatherAPI(data) {
```

- `export` = makes this function available to other files that `import` it. Without `export`, only this file can use the function.
- `function normalizeWeatherAPI(data)` = defines a function named `normalizeWeatherAPI`. It accepts one input: `data` = the full raw response from WeatherAPI.

---

```js
    const current = data.current;
    const location = data.location;
```

WeatherAPI's response is a deeply nested object. For example:
```js
data.current.temp_c     // 32
data.location.name      // "Mumbai"
```

`const current = data.current` creates a shortcut variable. Instead of typing `data.current.temp_c` every time, you just write `current.temp_c`.

`const` = "constant" — the variable's value won't be reassigned (though the object inside can still be modified).

---

```js
    let aqiRaw = 0;
    if (current.air_quality) {
        const epaIndex = current.air_quality['us-epa-index'];
        const epaMap = { 1: 25, 2: 75, 3: 150, 4: 250, 5: 350, 6: 450 };
        aqiRaw = epaMap[epaIndex] || 50;
    }
```

- `let aqiRaw = 0` — Create a variable and set it to 0. `let` (unlike `const`) allows the value to be changed later.
- `if (current.air_quality)` — Check if WeatherAPI actually included air quality data (it only does when you request it with `aqi: 'yes'`).
- `current.air_quality['us-epa-index']` — Gets the EPA index value (1 to 6). The key `'us-epa-index'` has a hyphen, so we use bracket notation instead of dot notation.
- `const epaMap = { 1: 25, 2: 75, ... }` — A simple lookup dictionary. EPA gives us a category (1-6), and we convert it to an approximate AQI number.
- `epaMap[epaIndex] || 50` — Look up the EPA index in the map. If it returns `undefined` (not found), the `|| 50` part kicks in and uses 50 as default. The `||` operator means "OR" — use the left side if it's truthy, otherwise use the right side.

---

```js
    return {
        source: 'WeatherAPI',
        temp: current.temp_c,
        feels_like: current.feelslike_c,
        humidity: current.humidity,
        wind_kph: current.wind_kph,
        wind_dir: current.wind_dir,
        wind_degree: current.wind_degree,
        cloud: current.cloud,
        visibility: current.vis_km,
        uv: current.uv,
        is_day: current.is_day,
        condition_text: current.condition.text,
        aqi: aqiRaw,
        precip_mm: current.precip_mm,
        pressure_mb: current.pressure_mb,
        timestamp: new Date(location.localtime).toISOString(),
        lat: location.lat,
        lon: location.lon,
        city: location.name,
        country: location.country,
        raw: data
    };
```

`return` = sends this value back to whoever called the function.

This creates a new, flat object with standardised keys. Every key name is our own — we chose them. We pull values from the deep WeatherAPI response and map them to our standard names:

| Our Standard Key | WeatherAPI Source |
|---|---|
| `temp` | `current.temp_c` |
| `humidity` | `current.humidity` |
| `wind_kph` | `current.wind_kph` |
| `visibility` | `current.vis_km` |
| `city` | `location.name` |

`new Date(location.localtime).toISOString()` — Converts the local time string (e.g., `"2024-04-12 15:30"`) into a standard ISO 8601 format (`"2024-04-12T10:00:00.000Z"`).

`raw: data` — We keep the original WeatherAPI response attached. The frontend needs some of it directly (like the hourly forecast array).

---

## Lines 55–87 — `normalizeOpenMeteo()` Function

```js
export function normalizeOpenMeteo(data) {
    const cw = data.current_weather || {};
    const hourly = data.hourly || {};
```

Open-Meteo's structure is completely different. Weather data is in `current_weather`, hourly data is in `hourly`.

`|| {}` = "if `current_weather` is undefined/null, use an empty object `{}`". This prevents crashes when the field is missing.

---

```js
    const temp = cw.temperature ?? (hourly.temperature_2m?.[idx] ?? null);
```

`??` = **nullish coalescing operator**. "Use the left value IF it's not null/undefined, otherwise use the right value."

`?.` = **optional chaining**. `hourly.temperature_2m?.[idx]` means: "Access `hourly.temperature_2m[0]` BUT only if `hourly.temperature_2m` exists. If it doesn't, return `undefined` instead of crashing."

**Step by step:**
1. Try `cw.temperature` first
2. If null → try `hourly.temperature_2m[0]`
3. If that's also null → return `null`

---

```js
    const visibility = hourly.visibility?.[idx] != null
        ? hourly.visibility[idx] / 1000
        : null;
```

`condition ? valueIfTrue : valueIfFalse` = **ternary operator** (shorthand if/else).

Open-Meteo gives visibility in **metres**. We divide by 1000 to convert to **kilometres** to match WeatherAPI's format.

---

```js
    return {
        source: 'Open-Meteo',
        temp,
        feels_like: null,   // Not provided in current_weather block
        humidity,
        wind_kph: windKph,
        wind_dir: null,
        cloud,
        visibility,
        uv: null,
        aqi: null,          // Open-Meteo doesn't provide AQI
        ...
    };
```

Open-Meteo doesn't provide everything WeatherAPI does — `feels_like`, `wind_dir`, `uv`, `aqi` are all `null`. This is fine — the fusion engine handles nulls gracefully.

Notice `temp,` (shorthand) — when the value variable has the same name as the key, you don't need `temp: temp`. You just write `temp`.

---

## Lines 93–184 — `synthesizeWeatherApiRaw()` Function

```js
export function synthesizeWeatherApiRaw(omData, q) {
```

This is a **fallback factory**. If WeatherAPI completely fails (server down, quota exceeded), this function creates a fake WeatherAPI-shaped response using Open-Meteo data. This prevents the frontend from crashing.

```js
    const code = cw.weathercode || 0;
    if (code >= 1 && code <= 3) conditionText = "Partly Cloudy";
    else if (code >= 45 && code <= 48) conditionText = "Foggy";
    else if (code >= 51 && code <= 67) conditionText = "Rainy";
    else if (code >= 71 && code <= 77) conditionText = "Snowy";
    else if (code >= 95) conditionText = "Thunderstorm";
```

Open-Meteo uses **WMO weather codes** (international standard numbers). This maps those codes to human-readable condition labels. Code 45 = Fog, code 95 = Thunderstorm, etc.

The function then builds a fake object that looks exactly like a WeatherAPI response, using Open-Meteo data where possible and sensible defaults (`pressure_mb: 1013`, `humidity: 50`) where not.

---

## What Happens Next

The normalised snapshots (one from each API) are passed to `fusionEngine.js` which blends them into a single `fused` object used by all other engines.

---

*Next: [02_fusionEngine.md](./02_fusionEngine.md)*
