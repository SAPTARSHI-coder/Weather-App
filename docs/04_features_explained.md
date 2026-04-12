# 🔑 Key Features — The Simplest Possible Explanations

> These are the "WHY" answers. Not just what the feature does, but why it exists at all.

---

## Feature 1 — Why Do We Use Multiple APIs?

### The Problem With One Source

Think about weather forecasting like asking someone *"What's the traffic like on the highway?"*

If you only ask **one person**, you get one opinion. But:
- What if they took a different route?
- What if their information is 30 minutes old?
- What if they guessed?

You get a more reliable answer if you ask **two people** who independently checked. If both say **"It's clear"** → confident. If one says **"Clear"** and the other says **"Jammed"** → investigate further.

### SkyGlass Uses 3 APIs For 3 Different Jobs

| API | Cost | Job It Does |
|---|---|---|
| **WeatherAPI.com** | Requires a free key | Current weather + AQI + 3-day forecast |
| **Open-Meteo.com** | 100% free, no key | 7-day extended forecast + hourly data |
| **OpenWeatherMap** | Requires a free key | Satellite cloud tile images for the MAP only |

WeatherAPI is the **primary source** — detailed, reliable, with AQI.
Open-Meteo is the **secondary source** — free, longer range, no key needed.
OpenWeatherMap only provides **visual map tiles** — the actual rain/cloud overlays you see on the map.

### What Happens If One API Goes Down?

The system **gracefully degrades**:
- If Open-Meteo fails → still works with WeatherAPI only (3-day forecast, confidence drops to Low)
- If WeatherAPI fails → system synthesizes a fake WeatherAPI structure from Open-Meteo data and continues
- If BOTH fail → server returns a clear error: *"All weather data sources unavailable"*

> **Real-life analogy:** A hospital has a primary blood test lab and a backup lab. If the primary lab's machine breaks, the backup lab still processes your test. The doctor gets the result either way.

---

## Feature 2 — What Is Caching? Why Does It Matter?

### The Problem Without Caching

Every time someone searches **"Mumbai"**, the server makes:
- 1 call to WeatherAPI
- 1 call to Open-Meteo

Each call takes ~300–700 milliseconds. If 50 people search Mumbai in 5 minutes, that's **100 external API calls** — burning through your free quota, making users wait, and hammering someone else's server for no reason.

### The Solution: Cache = Memory Drawer

The server keeps a **memory drawer** (called a `Map` in JavaScript — think of a named filing cabinet).

After the first Mumbai search, the full processed result is saved:
```
Key:   "fused:mumbai"
Value: { temp: 32, humidity: 72, rain_prob: 63, ... }
Saved at: 2:15 PM
Expires: 2:25 PM (10 minutes later)
```

For the next 10 minutes, any Mumbai search instantly gets the saved answer from the drawer — **no API calls made at all**.

### The Benefit

| | Without Cache | With Cache |
|---|---|---|
| Response time | 600–800 ms | ~2 ms |
| API calls for 50 users | 100 | 2 |
| API quota used | High | Minimal |
| User experience | Slow repeat searches | Instant repeat searches |

The TTL (Time To Live) is 10 minutes because weather doesn't change meaningfully faster than that.

> **Real-life analogy:** A call centre gets 50 calls asking "What are your business hours?" Instead of the agent looking it up each time, they have a printed card on their desk with the answer. Same answer, instant delivery, no effort repeated.

---

## Feature 3 — What Is A Backend Server? Why Do We Need One?

### The Dangerous Alternative: Calling APIs Directly From The Browser

You might think: *"Why not just have the webpage call WeatherAPI directly? Why the middleman server?"*

Here's why that's a terrible idea:

**Problem 1: Stolen API Keys**
Your WeatherAPI key is a secret password. If you put it in browser JavaScript, **anyone** can press `F12` (DevTools), go to the Network tab, and read your key. They then use it to exhaust your quota or rack up charges.

```
Browser JavaScript (VISIBLE TO EVERYONE):
const key = "a1b2c3d4...";  ← Stolen in 2 seconds
```

The backend server keeps the key in a `.env` file. The browser **never sees it**. The browser only talks to your own server.

**Problem 2: CORS Restrictions**
Most weather APIs block direct browser requests from other websites (this security rule is called CORS — Cross-Origin Resource Sharing). But a **server-to-server** request bypasses this entirely.

**Problem 3: No Intelligence**
The 12 intelligence engines, caching, fusion, normalization — none of that can safely or efficiently live in the browser. The backend is where all the computation happens.

> **Real-life analogy:** You don't walk into a bank vault yourself to get money. You tell a bank teller (the server) what you need. The teller goes backstage, validates your identity, retrieves the cash, and brings it to you. You never see or touch the vault.

---

## Feature 4 — What Is An API Key? Why Must It Be Secret?

### What Is An API Key?

An API key is like a **library card**. WeatherAPI gives you one when you register. It says: *"This person is allowed to make X requests per day."*

A typical key looks like:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

It's just a long random string. But it's tied to YOUR account.

### Why Must It Be Secret?

If someone else gets your key, they can:
- Make thousands of requests → exhaust your free quota
- Get you **banned** from the service
- In paid plans: rack up huge charges on your credit card

### How SkyGlass Protects It

The key lives ONLY in the `.env` file on the server:
```
WEATHER_API_KEY=a1b2c3d4...
```

The `.gitignore` file tells Git: *"Never upload .env to GitHub."*

On Render (the hosting service), the key is entered directly in the Render dashboard — it never appears in any code file.

> **Real-life analogy:** Your ATM PIN is like an API key. You never write it on the card itself. You never tell the shopkeeper your PIN. You only use it at the machine yourself — the machine (server) validates it privately.

---

## Feature 5 — What Is Weighted Averaging?

### Simple Version

If two people rate a movie:
- Expert critic: 7/10
- Your friend: 9/10

A 50/50 average = 8/10.

But if you trust the critic **more** (60%), the weighted average is:
```
(7 × 0.60) + (9 × 0.40) = 4.2 + 3.6 = 7.8/10
```

The critic's opinion pulled the score down because they have more weight.

### In SkyGlass

```
WeatherAPI temperature = 32°C (weight: 60%)
Open-Meteo temperature = 30°C (weight: 40%)

Fused temp = (32 × 0.60) + (30 × 0.40)
           = 19.2 + 12.0
           = 31.2°C
```

WeatherAPI is given 60% because it uses local ground stations and provides AQI.
Open-Meteo gets 40% because it's satellite-model-based and better for longer range.

---

## Feature 6 — What Is A Ring Buffer?

### The Problem With Infinite Memory

The Trend Engine needs to remember past temperature readings. But if you store every reading forever, the list grows infinitely and becomes useless — old data from 6 hours ago doesn't help predict the next hour.

### The Solution: Ring Buffer

A ring buffer is a **fixed-size circular list**. Imagine a notepad with exactly 12 lines. When it's full:
- Write a new reading → it overwrites the **oldest** line automatically.
- The notepad always has exactly 12 readings — the most recent 12.

```
Position: [1]  [2]  [3]  [4]  [5]  [6]  [7]  [8]  [9]  [10] [11] [12]
Temp(°C):  28   29   30   31   32   33   32   31   32   33   34   35
                                                               ↑ newest
```

When position 13 arrives → it overwrites position 1. The buffer "wraps around."

The Trend Engine runs **linear regression** on these 12 points to find the slope (direction of change).

> **Real-life analogy:** A hospital records a patient's temperature every 30 minutes but only keeps the last 12 readings on the bedside chart. Older readings are thrown out. The doctor looks at the chart — if all 12 readings are going up → fever is worsening.

---

## Feature 7 — What Is `localStorage`? (The Memory Across Refreshes)

Without `localStorage`, every time you refresh the page, the app forgets:
- Which city you searched
- Whether you prefer Celsius or Fahrenheit
- Which cities you saved to favourites

`localStorage` is a tiny storage area **built into every browser** that survives page refreshes and even closing the tab.

`storageUtils.js` is the helper file that manages this:

```js
// Saving a city to favourites
saveCity({ name: "Mumbai", lat: 19.07, lon: 72.87 });

// Reading saved cities when page loads
const saved = getSavedCities(); // → ["Mumbai", "Delhi", "London"]
```

> **Real-life analogy:** It's like writing things on a sticky note and putting it on your fridge. You can come back tomorrow, and the note is still there. That's localStorage — it survives restarts.

---

## Feature 8 — Rate Limiter — Protecting the Server From Abuse

### What Is Rate Limiting?

The server could be abused by:
- A script that sends thousands of requests per second (a "bot attack")
- Someone trying to exhaust our API quota on purpose

The rate limiter says: *"Each user (identified by their IP address) can only make 100 requests per 10 minutes. After that, you get an error message."*

```js
rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100,                  // 100 requests per 10 min per IP
    message: "Too many requests. Try again later."
})
```

> **Real-life analogy:** A bank ATM lets you enter your PIN wrong 3 times. On the 4th attempt it blocks you. The rate limiter does the same — blocks excessive users before they can cause damage.

---

*Next: [05_code_walkthrough.md](./05_code_walkthrough.md) — Every File's Code Explained Line By Line*
