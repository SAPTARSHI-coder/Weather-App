# 📖 Glossary — Every Technical Term, In Plain English

> If a word confused you anywhere in these docs, find it here.
> Sorted A–Z. No jargon. No assumptions.

---

## A

### API (Application Programming Interface)
A way for two programs to talk to each other over the internet.
Analogy: A waiter. You (the browser) tell the waiter what you want. The waiter goes to the kitchen (WeatherAPI) and brings back your order. You never enter the kitchen yourself.

### API Key
A secret password that grants access to an external service. Looks like a random string: `a1b2c3d4e5f6...`. Must be kept secret — if stolen, someone else uses your quota.

### AQI (Air Quality Index)
A single number (0–500) that summarises how clean or polluted the air is.
- 0–50: 🟢 Good
- 51–100: 🟡 Moderate
- 101–150: 🟠 Unhealthy for Sensitive Groups
- 151–200: 🔴 Unhealthy
- 201–300: 🟣 Very Unhealthy
- 301+: 🟤 Hazardous

### `async` / `await`
`async` marks a function that performs slow operations (like network calls).
`await` pauses that function until the slow operation finishes — without freezing the whole program.
Analogy: Ordering food at a restaurant. You place the order (`async`), then sit and wait (`await`). You're not cooking it yourself — you just wait for it to arrive.

### Axios
A JavaScript library used on the server to make HTTP requests. More powerful than `fetch` — handles retries, timeouts, and error messages better.

---

## B

### Backend
Code that runs on a server (a computer in the cloud), not in your browser. Handles data fetching, security, caching, and computation.
Opposite of: Frontend.

### Browser
The program you use to visit websites — Chrome, Firefox, Edge, Safari. It runs your frontend code.

### Bundle
A single large file created by combining many smaller JavaScript files. Vite creates this. Reduces the number of HTTP requests the browser needs to make.

---

## C

### Cache / Caching
Saving a computed result in memory so the next identical request can use the saved result instantly.
Analogy: A call centre agent writes the answer to a common question on a sticky note. Next time someone asks, they read off the note instead of looking it up again.

### Canonical Schema
A standardised data format that everyone agrees to use. The Normalizer converts both API formats into one canonical schema so the rest of the system always knows what to expect.

### CDN (Content Delivery Network)
A network of servers distributed around the world. Vercel uses a CDN — when you visit the site from India, the nearest server (maybe in Singapore) responds, making it fast.

### Cloud Cover
What percentage of the sky is covered by clouds. 0% = perfectly clear. 100% = completely overcast.

### CORS (Cross-Origin Resource Sharing)
A security rule browsers follow: they block JavaScript from making requests to a different website's domain unless that other website explicitly allows it.
Why it matters: Many weather APIs block direct browser requests. Server-to-server requests bypass CORS.

---

## D

### Dashboard
The main visual display of the app — all the cards, charts, badges, and panels showing weather data.

### Debounce
A technique to delay a function call until the user has stopped doing something. In SkyGlass, the autocomplete search waits 800ms after you stop typing before calling the server. Prevents sending a request for every single keystroke.

### DOM (Document Object Model)
The live, editable version of the HTML page in memory. JavaScript uses the DOM to find elements (`getElementById`) and change their content (`textContent = "32°C"`).

### `dotenv`
A Node.js library that reads a `.env` file and makes its values available in the program as `process.env.VARIABLE_NAME`.

---

## E

### Endpoint
A specific URL on the server that responds to requests.
- `/api/weather` → returns weather data
- `/api/history` → returns historical data
- `/api/search` → returns city autocomplete suggestions

### `.env` file
A plain text file containing secret values (API keys, port numbers). Never uploaded to GitHub. Read by `dotenv` at startup.

### Express.js
A Node.js library that makes building web servers simple. Handles routing (which function to run for which URL), middleware, and sending responses.

### Extrapolation
Using known past values and a trend to predict a future value.
Example: Temperature was 30, 31, 32 over three readings. Extrapolating: probably 33 next.
Used by: `predictionEngine.js`

---

## F

### Fallback
A backup plan when the primary plan fails. If WeatherAPI fails, SkyGlass falls back to using only Open-Meteo. If both fail, it returns a clear error message.

### `fetch()`
A built-in browser function for making HTTP requests. Returns a Promise. Used by `script.js` to talk to the server.

### Frontend
Code that runs inside the browser — what the user sees and interacts with. Files: `index.html`, `style.css`, `script.js`, `mapUtils.js`.

### Fusion / Fused Data
The result of combining two data sources into one. Handled by `fusionEngine.js`.

---

## G

### Geocoding
Converting a city name (like "Mumbai") into GPS coordinates (latitude/longitude) so a map or satellite-based API can use them.
Used when WeatherAPI fails — Open-Meteo's geocoding API is used as a fallback.

### Geolocation
The browser's ability to detect your physical location using GPS, Wi-Fi, or cell tower triangulation. Used by SkyGlass on startup to auto-load local weather.

### GET Request
An HTTP request that says "Give me data." Opposite of POST (which sends data). All SkyGlass API calls are GET requests.

### Glassmorphism
A UI design style where elements look like frosted glass — blurred background visible through a semi-transparent panel. Created in CSS using `backdrop-filter: blur()`.

---

## H

### Heat Index
A formula that calculates how hot it feels when taking humidity into account. High humidity prevents sweat from evaporating, making you feel hotter. Used by `realFeelEngine.js`.

### HTTP (HyperText Transfer Protocol)
The communication language of the web. When your browser visits a URL, it sends an HTTP request. The server sends an HTTP response.

### HTML (HyperText Markup Language)
The language that defines the structure of a webpage — headings, paragraphs, buttons, images, input boxes. `index.html` is the app's HTML file.

---

## I

### IANA Timezone
A standardised timezone name format like `"Asia/Kolkata"` or `"Europe/London"`. Used by `startCityClock()` to show the correct local time for the searched city.

### IP Address
A unique number assigned to every device on the internet (like `192.168.1.1`). The rate limiter uses IP addresses to track how many requests each user makes.

---

## J

### JavaScript (JS)
The programming language that makes webpages interactive. Runs in the browser (frontend) and also on the server via Node.js (backend).

### JSON (JavaScript Object Notation)
A text format for exchanging data between programs. Looks like:
```json
{ "city": "Mumbai", "temp": 32, "humidity": 84 }
```
All data exchanged between the browser and server in SkyGlass is JSON.

---

## L

### Latitude / Longitude
GPS coordinates. Latitude = how far north/south (Mumbai: 19.07°N). Longitude = how far east/west (Mumbai: 72.87°E). Used to call Open-Meteo which requires coordinates, not city names.

### Leaflet.js
An open-source JavaScript library for interactive maps. Used in SkyGlass for the weather map view — panning, zooming, clicking, and displaying satellite tile overlays.

### Linear Regression
A mathematical technique that finds the best-fit straight line through a set of data points. The slope of that line tells you the trend direction.
- Positive slope = values are going up
- Negative slope = values are going down
- Near zero = values are stable
Used by: `trendEngine.js`

### `localStorage`
A small storage area built into every browser that persists across page refreshes and tab closures. Used to save favourited cities and user preferences.

---

## M

### Map (JavaScript)
A data structure that stores key-value pairs. Like a dictionary: each word (key) has a definition (value). Used for the server's cache: `cache.set("fused:mumbai", data)`.

### Middleware
A function that runs between receiving a request and sending a response. CORS and rate limiting are middleware in SkyGlass.

### Minification
The process of removing all whitespace, comments, and long variable names from JavaScript to make file sizes smaller. Vite does this during `npm run build`.

---

## N

### Node.js
A runtime environment that lets JavaScript code run on a server (outside the browser). SkyGlass's backend runs on Node.js.
Analogy: Normally JavaScript only exists inside browsers. Node.js is like giving JavaScript a passport to travel to the server world.

### Normalizer
The part of the system that converts differently-structured data into one common format. `normalizer.js` converts both API responses into an identical "Canonical Snapshot."

### npm (Node Package Manager)
The tool used to install JavaScript libraries. `npm install` downloads all dependencies listed in `package.json`.

---

## O

### Open-Meteo
A free weather API (no key required) that provides 7-day forecasts and hourly data. Used as the secondary data source in SkyGlass.

### OpenWeatherMap (OWM)
A weather service used in SkyGlass exclusively for map tile overlays — the visual cloud and rain images layered over the Leaflet map.

### Outlier
A data value that is far outside the expected range. In SkyGlass: if WeatherAPI says 32°C and Open-Meteo says 25°C — a 7°C difference — that's an outlier. The outlier source is discarded.

---

## P

### `package.json`
The project's identity card. Lists the project name, version, all dependencies (external libraries needed), and npm scripts like `npm run dev` and `npm run build`.

### Perceived Temperature
How hot or cold the weather actually feels to a human body, accounting for humidity, wind, and sunlight. Called "RealFeel" in SkyGlass. Calculated by `realFeelEngine.js`.

### Port
A numbered "door" on a server computer. Multiple services can run on the same machine using different ports. SkyGlass backend uses port 3001 by default. Port 80 is standard HTTP, 443 is HTTPS.

### Pressure (Atmospheric / Barometric)
The weight of the atmosphere pressing down. Measured in millibars (mb) or hPa. Normal = ~1013 mb. Falling pressure = storm approaching. Rising pressure = fair weather coming.

### Promise
A JavaScript concept representing a value that will be available in the future. `async/await` is built on top of Promises. Used everywhere in SkyGlass for API calls.

---

## R

### Rate Limiting
Restricting how many requests a single user (identified by IP address) can make in a time window. SkyGlass limits each IP to 100 requests per 10 minutes.

### Ring Buffer
A fixed-size circular list that automatically overwrites the oldest entry when full. SkyGlass uses 12-entry ring buffers per city for trend tracking.

### Route / Routing
Defining which server function responds to which URL.
- `GET /api/weather` → fetch+process weather
- `GET /api/history` → fetch historical data
- `GET /api/search` → autocomplete search

---

## S

### Server
A computer (or program) that receives requests and sends responses. SkyGlass's server is `server.js` running on Node.js via Express.

### Slope
In mathematics: how steep a line is. A positive slope means the line goes up (values rising). A negative slope means falling. Zero slope = flat (stable). Calculated by linear regression in `trendEngine.js`.

### `setInterval(fn, 1000)`
A JavaScript function that runs `fn` every 1000 milliseconds (every second, indefinitely). Used by SkyGlass to tick the clock every second.

---

## T

### TTL (Time To Live)
How long cached data remains valid before being considered stale and discarded. SkyGlass uses a 10-minute TTL for weather data.

### Trend
The direction of change over time. Is temperature rising, falling, or stable? Computed by `trendEngine.js` using a ring buffer + linear regression.

---

## U

### UV Index
A scale (0–11+) measuring ultraviolet radiation from the sun. Higher = more dangerous for skin. Used by `realFeelEngine.js` (adds to perceived heat) and `insightEngine.js` (generates sun-exposure warnings).

---

## V

### Variance
How much a set of values jumps around. Low variance = stable. High variance = chaotic. Used by `stabilityEngine.js` to classify atmospheric stability.

### Vite
A build tool that compiles and bundles frontend code. `npm run build` runs Vite and produces the `dist/` folder — the optimised production-ready files.

---

## W

### WeatherAPI.com
The primary weather data source. Provides: current conditions, 3-day forecast, AQI, historical data, and city search autocomplete. Requires a free API key.

### Weighted Average
An average where some values count more than others.
`Result = (ValueA × WeightA) + (ValueB × WeightB)`
where WeightA + WeightB = 1 (100%).

### Wind Chill
How much colder wind makes you feel. Wind carries away body heat faster than still air. Formula accounts for temperature and wind speed. Relevant when temp < 10°C and wind > 5 km/h. Used by `realFeelEngine.js`.

---

## Z

### Zero-based Indexing
In programming, lists start counting at 0, not 1. The first item is at index `[0]`, the second at `[1]`, etc. Relevant when reading through ring buffer or forecast array code.

---

*This glossary covers every term used across all SkyGlass documentation.*
*If you encounter a term not listed here, it will always be explained in context within the doc where it appears.*
