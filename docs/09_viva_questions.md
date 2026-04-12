# 🎓 Viva Questions — What Your Teacher Will Ask + Model Answers

> These are the most likely questions a teacher, examiner, or interviewer will ask.
> Read the question, cover the answer, try to answer yourself, then check.

---

## Question 1 — The Classic Opener

### ❓ "What is your project? Explain it in 2 minutes."

**Model Answer:**

> "I built a weather application called SkyGlass. But instead of just fetching data from one weather service and displaying it, my system does something more intelligent.
>
> It fetches data from two completely independent weather APIs simultaneously — WeatherAPI.com and Open-Meteo.com. It then normalizes both responses into a common format, and fuses them together using weighted averaging — trusting each source based on how reliable it is for each specific measurement.
>
> This fused data is then passed through 12 custom intelligence engines that compute things like real perceived temperature, rain probability, air quality analysis, trend direction, one-hour prediction, danger anomaly detection, and atmospheric stability. Finally, all of this is converted into plain English insights that the user can act on.
>
> The entire backend runs on a Node.js server using Express, which protects the API keys, caches responses for 10 minutes to reduce API usage, and rate-limits requests to prevent abuse. The frontend is built with HTML, CSS, and JavaScript using Vite as the build tool."

---

## Question 2 — Architecture

### ❓ "Why did you build a backend server? Why not call the APIs directly from the browser?"

**Model Answer:**

> "There are three main reasons.
>
> First, **security**: The weather APIs require API keys — secret passwords that grant access. If I put the key inside JavaScript running in the browser, anyone could open DevTools with F12, go to the Network tab, and read the key. They could steal it, exhaust my free quota, or if it were a paid plan, run up charges. By putting the key only in the server's `.env` file, the browser never sees it.
>
> Second, **CORS restrictions**: Many APIs block direct browser-to-API requests from other domains for security reasons. A server-to-server request doesn't have this restriction.
>
> Third, **processing power**: Running 12 intelligence engines, maintaining a trend ring buffer, computing weighted fusion, and caching results — all of that is computation that belongs on the server, not the browser. Doing it in the browser would expose all business logic and would also slow down the user's machine."

---

## Question 3 — Core Algorithm

### ❓ "What is weighted averaging and why did you use it instead of a simple average?"

**Model Answer:**

> "A simple average treats both sources as equally trustworthy. For example, if WeatherAPI says 32°C and Open-Meteo says 30°C, a simple average gives 31°C, assuming both are equally reliable.
>
> But they're not equally reliable for every measurement. WeatherAPI uses real ground-based weather stations and provides more granular current conditions. Open-Meteo is a numerical forecast model better suited for longer-range predictions.
>
> So I implemented weighted averaging — WeatherAPI gets 60% of the weight and Open-Meteo gets 40% for temperature. For humidity, I give WeatherAPI 100% weight because Open-Meteo's hourly humidity values are less accurate for current conditions. For cloud cover, both get 50% because both use satellite data equally.
>
> The formula is: `FusedTemp = (WeatherAPI × 0.60) + (OpenMeteo × 0.40)`
>
> I also added outlier protection: if the two sources disagree by more than 5°C, the secondary source is completely discarded rather than dragging the result toward a bad reading."

---

## Question 4 — Data Structures

### ❓ "What is a ring buffer? Why did you use it for trend analysis?"

**Model Answer:**

> "A ring buffer is a fixed-size circular data structure. In my project, I use one with a capacity of 12 for each city. Every time a weather request is made for a city, the current reading is added to the buffer. When the buffer is full — when all 12 slots are occupied — the newest entry overwrites the oldest one automatically.
>
> I chose this over a regular growing array for two reasons:
>
> First, **memory efficiency**: a regular array would grow indefinitely. If the app runs for 12 hours and records every 30 minutes, that's 24 entries. Over many cities, this becomes a memory problem. The ring buffer always stays at exactly 12 entries.
>
> Second, **relevance**: temperature from 10 hours ago is irrelevant to predicting the next hour. I only want the most recent 12 readings — which is exactly what the ring buffer gives.
>
> On these 12 values, I run linear regression — a mathematical formula that finds the best-fit straight line through the points. The slope of that line tells me if the temperature is rising, falling, or stable. This slope is what powers the '↑ Rising' and '↓ Falling' indicators on the dashboard."

---

## Question 5 — Intelligence Engines

### ❓ "How does your rainfall prediction work?"

**Model Answer:**

> "My rain probability engine uses a 5-factor scoring system rather than relying on a single indicator.
>
> The five factors are: humidity, atmospheric pressure trend, cloud cover percentage, visibility, and current precipitation. Each factor contributes a different number of points to a cumulative score based on its current value.
>
> For example, if humidity is above 90%, that adds 35 points. If atmospheric pressure is falling rapidly — which is a classic meteorological sign of an approaching storm — that adds up to 25 points. High cloud cover adds up to 20 points. Low visibility suggests precipitation may already be starting, adding up to 15 points. And if there's actual current precipitation, that's the strongest signal and adds up to 40 points.
>
> All these scores are added together and then clamped between 0 and 100 using `Math.min(100, score)` to ensure the percentage is always valid.
>
> The reason I use 5 factors instead of one is that no single factor is conclusive. High humidity alone doesn't mean rain — humidity in a desert can be low, but it can also be high on a cool morning without any rain. The combination of multiple factors together gives a much more reliable estimate. It's similar to how a detective builds a case — no single clue is a conviction, but 5 clues pointing in the same direction is very strong evidence."

---

## Question 6 — Caching

### ❓ "What is caching and why does it improve your application?"

**Model Answer:**

> "Caching means storing a computed result in memory so that the next identical request can return the saved result instantly, without recomputing everything from scratch.
>
> In my server, after processing a weather request for 'Mumbai' — which involves two API calls, normalization, fusion, and 12 engine computations — I store the final result in a JavaScript `Map` object with the key `fused:mumbai` and a timestamp.
>
> For the next 10 minutes, if anyone searches for Mumbai, the server checks the Map first. If the entry is less than 10 minutes old, it returns the saved result immediately — in about 2 milliseconds instead of the usual 600–800 milliseconds. If it's older than 10 minutes, it's considered stale and fresh data is fetched.
>
> The benefits are threefold: response time drops dramatically for repeat searches, API quota is preserved (50 users searching Mumbai generates 2 API calls instead of 100), and the user experience for repeat searches feels instantaneous.
>
> The 10-minute TTL is chosen deliberately — weather doesn't change meaningfully faster than that, so showing data that's up to 10 minutes old is a reasonable trade-off."

---

## Question 7 — Security

### ❓ "How do you protect your API keys in this project?"

**Model Answer:**

> "I follow three layers of protection.
>
> First, the API keys are stored only in a `.env` file on the server. This file uses the format `WEATHER_API_KEY=yourkey`. The `dotenv` library reads this file at server startup and makes the values available in code as `process.env.WEATHER_API_KEY`. The key is used exclusively in `server.js` and is never passed to the browser.
>
> Second, the `.env` file is listed in `.gitignore`, which tells Git to never upload it to GitHub. So even if someone clones my repository, they get no keys.
>
> Third, when deployed on Render (the hosting platform), the API keys are entered directly in Render's dashboard environment variables. They never appear in any code file that could be committed.
>
> The only key that reaches the browser is the OpenWeatherMap key for map tiles — and this is done intentionally through a dedicated `/api/config` endpoint that only exposes that one key, since the Leaflet map tile library needs it in the browser to fetch satellite imagery."

---

## Question 8 — Frontend

### ❓ "What does script.js do? Why is it the most important frontend file?"

**Model Answer:**

> "`script.js` is the frontend's brain. It handles every user interaction and all dynamic behavior of the interface.
>
> On page load, it detects the user's GPS location using `navigator.geolocation` and sends that to the server to fetch local weather. If GPS is denied, it defaults to Kolkata.
>
> It listens for user actions — search button clicks, Enter key presses, map clicks — and calls `loadCity()` which sends an HTTP GET request to our server's `/api/weather` endpoint.
>
> When the server responds, `updateUI()` reads the JSON data and updates every single element on the dashboard — temperature, condition label, confidence badge, rain probability, insights panel, wind direction, AQI badge, the 7-day forecast strip, the city clock, and more.
>
> It also manages the city clock by converting the user's current time into the searched city's timezone using JavaScript's `Intl` locale API. It draws the hourly temperature chart using Chart.js, and it maintains the favourites list using localStorage through `storageUtils.js`.
>
> Without script.js, the page would be a static, unclickable picture. JavaScript is what makes the page alive and interactive."

---

## Question 9 — Design & Architecture

### ❓ "Why did you split the intelligence logic into 12 separate files instead of one big file?"

**Model Answer:**

> "This follows a software engineering principle called the **Single Responsibility Principle** — each module should do exactly one thing.
>
> If all 12 engines were one massive function in `server.js`, that file would be 1,500+ lines of mixed logic. When the rain probability formula needed updating, someone would have to search through code about AQI, confidence, anomalies, and predictions to find the rain-related section. A bug in one calculation could silently affect another.
>
> By separating each engine into its own file — `rainEngine.js`, `trendEngine.js`, `anomalyEngine.js` etc. — each file contains only that specific logic. Anyone can open `rainEngine.js` and immediately understand its purpose without reading any other file.
>
> It also makes each engine independently testable. You can write a unit test for `calcRainProbability()` by just importing `rainEngine.js` and passing in test values — you don't need to run the entire server.
>
> And it makes the code replaceable — if I want to upgrade the prediction algorithm, I modify only `predictionEngine.js`. Nothing else changes."

---

## Question 10 — Deployment

### ❓ "Why did you deploy on two platforms — Render AND Vercel?"

**Model Answer:**

> "Render and Vercel serve different purposes and demonstrate understanding of different deployment strategies.
>
> Render is a full-stack hosting platform. It runs my Node.js server (`server.js`) continuously, handles all API calls, runs the intelligence engines, and manages caching. This is the complete, production-quality version of SkyGlass with all features working. The downside is that on the free tier, the server sleeps after inactivity and takes a few seconds to wake up on the first request.
>
> Vercel is a static hosting platform — it only serves files, it can't run a server. I deploy the compiled `dist/` folder there — the output of running `vite build`. It's served from a global CDN (Content Delivery Network), making it extremely fast from any location in the world. But without the backend, the API calls don't work and you see the loading state.
>
> Deploying on both demonstrates that I understand the difference between static hosting and compute hosting, and when to use each. Vercel is the superior choice if you only have a React/HTML app. Render is necessary when you need server-side computation."

---

## Bonus — Quick Fire Round

**Q: What is JSON?**
A: JavaScript Object Notation. A text format for exchanging data between programs. Looks like: `{"name": "Mumbai", "temp": 32}`.

**Q: What is an npm script?**
A: A shortcut command defined in `package.json`. `npm run dev` starts both server and Vite. `npm run build` compiles the frontend.

**Q: What does `async/await` mean?**
A: `async` marks a function that can wait for slow operations. `await` pauses execution at that line until the slow operation (like an API call) finishes — without freezing the whole program.

**Q: What is Express?**
A: A Node.js library that makes building web servers simple. It handles routing (which function runs for which URL), middleware, and sending responses.

**Q: What does `Math.min(100, score)` do?**
A: Returns whichever is smaller — 100 or the score. If score = 135, it returns 100. If score = 63, it returns 63. Used to ensure rain probability never exceeds 100%.

**Q: What is the difference between `fetch` and `axios`?**
A: Both make HTTP requests. `fetch` is built into the browser. `axios` is a library used on the server side — it has better error handling, automatic JSON parsing, and retry support.

**Q: What is Vite?**
A: A build tool that takes your raw HTML, CSS, and JavaScript files (which import libraries from `node_modules`) and compiles them into optimized, minified, browser-ready files in the `dist/` folder.

**Q: What is Leaflet.js?**
A: An open-source JavaScript library for interactive maps. Used in SkyGlass to show the satellite weather tile overlays and allow click-to-search on the map.

---

*You are now ready for your viva. Good luck, Saptarshi! 🎓*
