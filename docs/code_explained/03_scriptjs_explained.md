# 🟨 script.js — Line by Line

> **File:** `script.js` (project root)
> **Job:** The brain running IN the browser. Fetches data from the server, updates every element on the screen, draws charts, runs the clock, manages the map, and handles all user interactions.

---

## What This File Does

After the server sends back the weather JSON, something has to actually *read* it and update the screen. That's `script.js`. It's the bridge between the server's data and what you see on the page.

**Analogy:** If `index.html` is a TV set and `server.js` is the broadcasting station, then `script.js` is the TV's electronics — it receives the signal (data), processes it, and displays the picture (UI).

This file is large (~850 lines). We'll cover each major section.

---

## Lines 1–20 — Getting the Server Base URL

```js
const BASE_URL = (() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `http://${window.location.hostname}:3000`;
    }
    return window.location.origin;
})();
```

**IIFE** (Immediately Invoked Function Expression) — A function that defines itself and runs immediately. The `()` at the end calls it right away.

`window.location.hostname` — The domain of the current page (e.g., `"localhost"` or `"skyglass.render.com"`).

**Why this logic?**
- In development (localhost): the HTML frontend runs on some port (e.g., 5500 via Live Server), but the API server is always on port 3000. So we need `http://localhost:3000`.
- In production (deployed): the frontend and backend are served from the same server. So `window.location.origin` = `"https://skyglass.onrender.com"` and API calls go to the same domain.

---

## Lines 22–60 — DOM Element References

```js
const cityNameEl     = document.getElementById('city-name');
const temperatureEl  = document.getElementById('temperature');
const conditionEl    = document.getElementById('condition');
const feelsLikeEl    = document.getElementById('feels-like');
const windSpeedEl    = document.getElementById('wind-speed');
const humidityEl     = document.getElementById('humidity-value');
// ... many more
```

`document.getElementById('id')` — Finds the HTML element with that ID and returns a reference to it.

We store these references in constants ONCE at the top, so we don't have to search the DOM (Document Object Model) repeatedly. Each `getElementById` call scans the entire page — caching the result is faster.

`const` — These references don't change (we always update the same element). The element's content changes, but the reference to the element stays constant.

---

## Lines 62–110 — The Clock System

```js
function updateClock() {
    const now = new Date();
    const hours   = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Digital clock
    clockEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Analog hands
    const hDeg = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;
    const mDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
    const sDeg = (seconds / 60) * 360;

    document.querySelector('.hour-hand').style.transform = `translateX(-50%) rotate(${hDeg}deg)`;
    document.querySelector('.min-hand').style.transform  = `translateX(-50%) rotate(${mDeg}deg)`;
    document.querySelector('.sec-hand').style.transform  = `translateX(-50%) rotate(${sDeg}deg)`;
}

setInterval(updateClock, 1000);
```

`new Date()` — Creates a Date object representing the current moment.

`now.getHours()`, `now.getMinutes()`, `now.getSeconds()` — Extract the hour, minute, second.

**Analog clock degree maths:**

- **Hour hand:** `((hours % 12) / 12) * 360` = what fraction of 12 hours have passed × 360°. `hours % 12` = converts 24h to 12h (e.g., 15 → 3).
  - Plus `(minutes / 60) * 30` = incremental movement within the hour (30° per hour = 360/12).
- **Minute hand:** `(minutes / 60) * 360` = fraction of 60 minutes × 360°.
  - Plus `(seconds / 60) * 6` = incremental movement within the minute.
- **Second hand:** `(seconds / 60) * 360` = fraction of 60 seconds × 360°.

`element.style.transform = 'rotate(Xdeg)'` — Directly sets the CSS `transform` property in JavaScript in real-time.

`setInterval(updateClock, 1000)` — Calls `updateClock` every 1000 milliseconds (1 second). This is how the clock ticks.

---

## Lines 115–160 — Greeting System

```js
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour >= 5 && hour < 12)      greeting = 'Good Morning';
    else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17 && hour < 21) greeting = 'Good Evening';
    else                              greeting = 'Good Night';

    greetingEl.textContent = greeting;
}
```

`new Date().getHours()` — Current hour (0–23).

The greeting changes based on time of day:
- 5am–11:59am → "Good Morning"
- 12pm–4:59pm → "Good Afternoon"
- 5pm–8:59pm → "Good Evening"
- 9pm–4:59am → "Good Night"

`element.textContent = 'text'` — Sets the visible text content of an HTML element.

---

## Lines 165–320 — Main `fetchWeather()` Function

```js
async function fetchWeather(query) {
    showLoading();
    try {
        const response = await fetch(`${BASE_URL}/api/weather?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        updateUI(data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}
```

`async function` — Allows `await` inside.

`showLoading()` — Shows the loading spinner overlay on screen while waiting.

`fetch(URL)` — Makes an HTTP GET request to the server at the given URL.

`encodeURIComponent(query)` — Encodes the query string safely. Converts "New Delhi" to "New%20Delhi" so the URL doesn't break (spaces in URLs cause problems).

`await fetch(...)` — Pauses until the server responds.

`!response.ok` — HTTP responses have a status code. `ok` is true for 200-299 (success). If it's 400, 500, etc., we throw an error.

`await response.json()` — Parses the response body as JSON. Two `await`s are needed — one to get the response, one to read its body.

`updateUI(data)` — Passes the full data object to the function that updates all screen elements.

`catch(error)` — If ANYTHING in the `try` block throws an error, this runs. Shows the error message to the user.

`finally { hideLoading() }` — Runs whether success or failure. Always hides the loading spinner.

---

## Lines 325–480 — `updateUI()` Function

This is the largest function — it takes the server's JSON and updates every element.

```js
function updateUI(data) {
    const { weather, fused, condition, condition_emoji, real_feel,
            real_feel_descriptor, smoothed_temp, aqi_category, aqi_health_tip,
            confidence_label, confidence_icon, sources_count, rain_probability,
            rain_factors, stability, anomalies, severity, insights,
            predicted_temp, predicted_condition, temp_direction,
            prediction_confidence, trends } = data;
```

**Destructuring the server response** — extracts all fields from `data` into individual variables in one line.

```js
    // Update city and temperature
    cityNameEl.textContent = fused.city + ', ' + fused.country;
    temperatureEl.textContent = `${Math.round(smoothed_temp)}°C / ${Math.round(smoothed_temp * 9/5 + 32)}°F`;
```

`fused.city + ', ' + fused.country` = string concatenation → `"Mumbai, India"`.

`Math.round(smoothed_temp)` = round to nearest integer for display.

`smoothed_temp * 9/5 + 32` = Celsius to Fahrenheit conversion formula. `9/5 = 1.8`.

```js
    // Update the big weather icon
    const iconClass = conditionToIcon(condition);
    mainWeatherIcon.className = `${iconClass} huge-icon`;
```

`element.className` = sets ALL class names at once (replaces any existing classes). This swaps the icon — e.g., from `ri-sun-fill huge-icon` to `ri-heavy-showers-fill huge-icon`.

```js
    // Update the body background based on condition
    document.body.className = `theme-${currentTheme}`;
    if (weather.current?.is_day === 0) {
        document.body.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #0f0c29 0%, ...');
    }
```

`weather.current?.is_day` — Optional chaining. If `current` is null, doesn't crash.

`document.body.style.setProperty('--variable', 'value')` — Changes a CSS custom property (variable) using JavaScript. This instantly changes the gradient background.

---

## Lines 482–560 — Chart Drawing

```js
function drawHourlyChart(forecastData, chartType = 'temp') {
    if (hourlyChart) hourlyChart.destroy();

    const labels = [];
    const values = [];

    forecastData.forecastday[0].hour.forEach(hour => {
        const timeLabel = new Date(hour.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        labels.push(timeLabel);
        if (chartType === 'temp')   values.push(hour.temp_c);
        else if (chartType === 'rain') values.push(hour.chance_of_rain);
        else if (chartType === 'wind') values.push(hour.wind_kph);
    });

    const ctx = document.getElementById('hourlyChart').getContext('2d');
    hourlyChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ data: values, ... }] },
        options: { ... }
    });
}
```

`if (hourlyChart) hourlyChart.destroy()` — If a chart already exists on the canvas, destroy it first. Otherwise Chart.js would draw on top of the old one.

`forecastDay[0].hour.forEach(hour => { ... })` — Iterates through all 24 hours of today's forecast. Builds the `labels` and `values` arrays.

`new Date(hour.time).toLocaleTimeString(...)` — Converts the time string `"2024-04-12 15:00"` to a formatted time display like `"3:00 PM"`.

`document.getElementById('hourlyChart').getContext('2d')` — Gets the 2D drawing context from the `<canvas>` element. This is what Chart.js draws on.

`new Chart(ctx, {...})` — Creates the chart. The configuration object describes: `type` (line/bar), `data` (labels + datasets), and `options` (styles, axis labels, etc.).

---

## Lines 565–630 — Map Integration

```js
let weatherMap = null;

function initMap(lat, lon, weatherData) {
    if (!weatherMap) {
        weatherMap = L.map('map-container').setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(weatherMap);
    } else {
        weatherMap.setView([lat, lon], 10);
    }
```

`L.map('map-container')` — Leaflet.js initialises the map inside the `<div id="map-container">`.

`setView([lat, lon], 10)` — Centers the map on the coordinates. `10` = zoom level (0 = world, 18 = street level).

`L.tileLayer(...)` — Loads map tiles (the actual map images) from OpenStreetMap. `{s}`, `{z}`, `{x}`, `{y}` are placeholders Leaflet replaces with the appropriate tile coordinates.

`if (!weatherMap)` — Only initialise the map once. If it already exists, just update the view.

```js
    weatherMap.invalidateSize();
```

`invalidateSize()` — Tells Leaflet to recalculate the map container size. Needed when the map becomes visible (switching to Map tab), otherwise it may not render correctly.

---

## Lines 635–720 — Search and Autocomplete

```js
citySearchEl.addEventListener('input', debounce(async (e) => {
    const value = e.target.value.trim();
    if (value.length < 2) { suggestionsEl.classList.add('hidden'); return; }

    const response = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(value)}`);
    const cities = await response.json();

    suggestionsEl.innerHTML = '';
    cities.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city.name + ', ' + city.country;
        li.addEventListener('click', () => {
            citySearchEl.value = li.textContent;
            fetchWeather(li.textContent);
            suggestionsEl.classList.add('hidden');
        });
        suggestionsEl.appendChild(li);
    });
    suggestionsEl.classList.remove('hidden');
}, 300));
```

`addEventListener('input', handler)` — Fires `handler` every time the user types in the search box.

**Debounce** — `debounce(fn, 300)` wraps a function so it only runs 300ms AFTER the user STOPS typing. Without this, every keystroke fires an API call — typing "Mumbai" would fire 6 API calls. With debounce, only one call fires after the user pauses.

`document.createElement('li')` — Creates a new `<li>` element in memory (not on the page yet).

`li.textContent = ...` — Sets its text.

`li.addEventListener('click', ...)` — Clicking the suggestion populates the search box and fetches weather.

`suggestionsEl.appendChild(li)` — Adds the `<li>` to the `<ul>` dropdown in the DOM (now it appears on screen).

`suggestionsEl.classList.remove('hidden')` — Shows the dropdown by removing the `hidden` class.

---

## Lines 724–780 — Geolocation

```js
function getUserLocation() {
    if (!navigator.geolocation) {
        fetchWeather('London');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeather(`${lat},${lon}`);
        },
        (error) => {
            console.warn('Geolocation failed:', error.message);
            fetchWeather('London');
        }
    );
}
```

`navigator.geolocation` — The browser's built-in geolocation API. Not available in all browsers or when permissions are denied.

`getCurrentPosition(successCallback, errorCallback)` — Asks the browser "where is the user?" The browser shows the permission popup. If allowed → `successCallback` runs with the coordinates. If denied → `errorCallback` runs.

`position.coords.latitude` / `.longitude` — GPS coordinates.

`fetchWeather(`${lat},${lon}`)` — Passes coordinates directly as the query. WeatherAPI accepts coordinates in this format.

Fallback to `'London'` — If geolocation isn't available or fails, default to London (a universally recognisable weather city).

---

## Lines 785–820 — Theme Toggle

```js
let currentTheme = 'dark';

themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.className = `theme-${currentTheme}`;
    themeToggleBtn.innerHTML = currentTheme === 'dark'
        ? '<i class="ri-sun-line"></i>'
        : '<i class="ri-moon-line"></i>';
});
```

`currentTheme === 'dark' ? 'light' : 'dark'` — Ternary toggle. If currently dark → switch to light, and vice versa.

`document.body.className = 'theme-light'` — Changes the CSS class on `<body>`. CSS variables for `--glass-bg`, `--text-primary` etc. automatically change because the `body.theme-light` CSS rules override the `:root` defaults.

The button icon changes (`ri-sun-line` ↔ `ri-moon-line`) to reflect the new theme.

---

## Lines 825–850 — Initialisation

```js
document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    updateClock();
    setInterval(updateClock, 1000);
    setInterval(updateGreeting, 60000);
    setInterval(() => {
        if (lastQuery) fetchWeather(lastQuery);
    }, 10 * 60 * 1000);

    getUserLocation();
});
```

`DOMContentLoaded` event — Fires when the HTML is fully parsed and all elements exist. This is the safest place to run initialisation code (we know all elements exist).

`setInterval(updateGreeting, 60000)` — Updates the greeting every 60 seconds (in case the user has the page open across midnight, for example).

`setInterval(() => { fetchWeather(lastQuery) }, 600000)` — Auto-refreshes weather data every 10 minutes for the currently searched city.

`getUserLocation()` — The first thing the app does on load — get the user's location and fetch weather.

---

## Summary — The Full Script.js Flow

```
Page loads
    → DOMContentLoaded fires
        → Start clock + greeting
        → Call getUserLocation()
            → Browser asks for GPS permission
                → If allowed: fetchWeather(lat, lon)
                → If denied: fetchWeather('London')
                    → Show loading spinner
                    → await fetch('/api/weather?q=...')
                        → Server responds with JSON
                    → updateUI(data)
                        → Update all text elements
                        → Draw charts
                        → Rotate wind compass
                        → Show anomaly banner
                        → Fill intelligence panel
                    → Hide loading spinner
        → Start 10-minute auto-refresh timer
```

---

*Return to [../00_index.md](../00_index.md) for the full document index.*
