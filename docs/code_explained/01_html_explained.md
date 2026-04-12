# 🌐 index.html — Line by Line

> HTML is the **skeleton** of your webpage. It describes WHAT is on the page — the boxes, buttons, text areas, and containers — but NOT how they look (that's CSS) or how they behave (that's JavaScript).

---

## What is HTML?

Think of HTML like a **house blueprint**. It shows where the walls, windows, doors, and rooms are. It doesn't tell you what colour to paint them (that's CSS) or how the doors open (that's JavaScript).

Every HTML instruction is called a **tag**. Tags come in pairs — an opening tag and a closing tag:
```html
<h1>Hello</h1>
```
- `<h1>` = opening tag (start of a big heading)
- `Hello` = the content inside
- `</h1>` = closing tag (end of the heading)

---

## Line 1
```html
<!DOCTYPE html>
```
**What it means:** "This file is an HTML5 document."
Every HTML file must start with this. It's like saying "This document follows the HTML5 rules." Without it, old browsers might misread the page.

`DOCTYPE` = Document Type Declaration. It's not a tag — it's a declaration.

---

## Line 2
```html
<html lang="en">
```
**What it means:** The entire webpage begins here. Everything on the page lives inside `<html>...</html>`.

`lang="en"` = tells the browser (and screen readers) this page is in English.

---

## Line 3
```html
<head>
```
**What it means:** The `<head>` section contains **invisible setup information** — things the browser needs to know but the user doesn't directly see. Think of it as the backstage area of a theatre.

---

## Line 4
```html
<meta charset="UTF-8">
```
**What it means:** "Use the UTF-8 character system."

`charset` = character set = which set of symbols the page can display.
`UTF-8` = a universal encoding that supports every language, emoji, and symbol on earth.
Without this, characters like ₹, é, ñ, or 🌤️ might look broken.

---

## Line 5
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```
**What it means:** "Make the page fit the screen properly on mobile."

`viewport` = the visible area of the browser window.
`width=device-width` = make the page width equal to the phone/tablet screen width.
`initial-scale=1.0` = no initial zoom — show the page at normal size.

Without this, mobile browsers would zoom out and show a tiny, hard-to-read page.

---

## Line 6
```html
<title>SkyGlass Weather</title>
```
**What it means:** Sets the text that appears on the browser tab and in Google search results.

If you open SkyGlass, you'll see "SkyGlass Weather" written on the browser tab at the top.

---

## Line 7
```html
<link rel="stylesheet" href="style.css">
```
**What it means:** "Load the file `style.css` and apply its styles to this page."

`<link>` = connects an external file to this HTML.
`rel="stylesheet"` = the linked file is a CSS stylesheet.
`href="style.css"` = the filename/path to load.

This is how CSS is connected to HTML. Without this line, the page would have zero styling — plain white background with black text.

---

## Lines 9–11 — Google Fonts
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```
**What this does:**
These three lines load the **Outfit** font from Google Fonts — a modern, clean typeface.

- `rel="preconnect"` = "Start connecting to Google's font servers early, before we need them." This speeds up font loading.
- `crossorigin` = allows loading fonts from a different website (cross-origin resource).
- `wght@300;400;500;600;700` = load font in these weights: light (300), regular (400), medium (500), semibold (600), bold (700).
- `display=swap` = show text in a fallback font immediately while the Outfit font loads, then swap it in. Prevents invisible text during load.

> **Analogy:** Like ordering a specific outfit for a person. While waiting for it to arrive, they wear casual clothes (fallback font). When the outfit arrives, they change into it (font swap).

---

## Line 13 — Icons
```html
<link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
```
**What this does:** Loads the **RemixIcon** icon library from a CDN (Content Delivery Network — a fast global server).

RemixIcon provides ~2,400 icon designs (like 🌤️☁️💨) that you can use with a simple CSS class like `<i class="ri-cloud-line"></i>`.

`cdn.jsdelivr.net` = a trusted free CDN that serves open-source libraries quickly.

---

## Line 15
```html
<body class="theme-dark">
```
**What it means:** The `<body>` tag contains everything the user **actually sees** on the page. Everything visible is a child of `<body>`.

`class="theme-dark"` = gives the body the CSS class `theme-dark`. In `style.css`, this class sets dark colour variables. JavaScript can later change this to `theme-light` to switch themes.

---

## Line 18
```html
<div class="app-container">
```
**What it means:** A `<div>` is a **generic container** — an empty box that groups other elements.

`class="app-container"` = gives this div a name. CSS uses this name to apply the rule `display: flex` which makes the sidebar and main content sit side-by-side.

> **Analogy:** A cardboard box. It doesn't look like anything by itself, but you put things inside it to organise them.

---

## Lines 20–32 — Sidebar Navigation
```html
<aside class="sidebar">
    <div class="logo">
        <i class="ri-cloud-windy-line"></i>
        <span>SkyGlass</span>
    </div>
    <nav>
        <a href="#" class="nav-btn active" data-target="dashboard">
            <i class="ri-dashboard-line"></i> Dashboard
        </a>
        <a href="#" class="nav-btn" data-target="map-view">
            <i class="ri-map-2-line"></i> Radar Map
        </a>
        <a href="#" class="nav-btn" data-target="saved-view">
            <i class="ri-heart-line"></i> Saved
        </a>
        <a href="#" class="nav-btn" data-target="history-view">
            <i class="ri-history-line"></i> History
        </a>
    </nav>
</aside>
```

**Tag by tag:**

- `<aside>` = a semantic HTML5 element for sidebar content (screen readers understand this means "sidebar").
- `<div class="logo">` = the logo area — contains the icon and the word "SkyGlass".
- `<i class="ri-cloud-windy-line">` = displays the cloud-wind icon from RemixIcon. `<i>` is normally italic text, but icon libraries repurpose it to display icons.
- `<span>SkyGlass</span>` = `<span>` is an inline container. Here it holds the logo text "SkyGlass".
- `<nav>` = semantic element for navigation links. Screen readers know this is a navigation menu.
- `<a href="#">` = a hyperlink. `href="#"` means "go nowhere" — JavaScript handles the actual navigation.
- `class="nav-btn active"` = two CSS classes applied: `nav-btn` styles the button, `active` highlights the currently selected page.
- `data-target="dashboard"` = a **custom data attribute**. JavaScript reads this to know which view to show when this button is clicked. `data-` attributes don't change the visual appearance — they store information for JavaScript to use.

---

## Lines 35–74 — Main Content + Search Bar

```html
<main class="main-content">
```
`<main>` = semantic element for the primary page content. Only one `<main>` per page (good for accessibility and SEO).

```html
<section class="hero-header">
    <div class="greeting-container">
        <h2 id="greeting">Good Morning</h2>
        <p class="welcome-text">Welcome back, here's your weather today.</p>
    </div>
</section>
```
- `<section>` = a semantic grouping of related content.
- `<h2>` = a second-level heading. JavaScript updates this text dynamically ("Good Morning" / "Good Afternoon" / "Good Evening").
- `id="greeting"` = a unique ID. JavaScript finds this element with `document.getElementById('greeting')` and changes its text.
- `<p>` = paragraph text.

```html
<input type="text" id="city-search" placeholder="Search for cities...">
```
- `<input>` = a form input where the user types.
- `type="text"` = accepts text input (not numbers, passwords, etc.).
- `id="city-search"` = unique ID so JavaScript can read what the user typed.
- `placeholder="Search for cities..."` = grey hint text shown when the input is empty.

```html
<ul id="search-suggestions" class="suggestions-dropdown hidden"></ul>
```
- `<ul>` = unordered list (bullet points, but styled to look like a dropdown).
- `id="search-suggestions"` = JavaScript fills this list with city suggestion items dynamically.
- `class="hidden"` = CSS hides this by default (`display: none`). JavaScript removes the `hidden` class when suggestions are ready.

---

## Lines 77–203 — The Dashboard Grid

```html
<div id="dashboard" class="view-section active">
```
- `id="dashboard"` = the main weather dashboard view.
- `class="view-section active"` = `view-section` makes it full-page. `active` makes it visible (CSS: `display: block`). When you click "Radar Map", JavaScript removes `active` from dashboard and adds it to `map-view`.

```html
<div class="dashboard-grid" id="main-dashboard-grid">
```
- The grid container. CSS gives this `display: grid` with 3 columns.

```html
<div class="card current-weather">
    <div class="weather-info">
        <h1 id="city-name">...</h1>
        <h2 id="temperature">...</h2>
        <p id="condition">...</p>
        <p id="feels-like" class="sub-value">Feels like --</p>
        <div id="confidence-badge" class="confidence-badge" style="display:none;"></div>
    </div>
    <div class="weather-visual">
        <i class="ri-moon-cloudy-line huge-icon"></i>
    </div>
</div>
```
- `<h1 id="city-name">` = the city name. `<h1>` = most important heading on the page (one per page, good for SEO). Starts as `...` and gets updated by JavaScript.
- `<h2 id="temperature">` = the big temperature number (e.g., "32°C / 90°F").
- `<p id="condition">` = the condition label (e.g., "Partly Cloudy").
- `id="feels-like"` = the perceived temperature line.
- `id="confidence-badge"` = the data reliability badge. `style="display:none"` hides it until data loads.
- `class="ri-moon-cloudy-line huge-icon"` = the big weather icon on the right side of the hero card.

---

## Lines 119–131 — Wind Card
```html
<div class="wind-rose" id="wind-rose" style="--rotation: 0deg;">
    <div class="needle"></div>
    <div class="direction N">N</div>
    <div class="direction E">E</div>
    <div class="direction S">S</div>
    <div class="direction W">W</div>
</div>
```
- `class="wind-rose"` = the circular compass graphic.
- `style="--rotation: 0deg"` = a **CSS custom property** (variable). JavaScript updates this to rotate the compass needle to the actual wind direction.
- `<div class="needle">` = the needle inside the compass. CSS + the `--rotation` variable makes it point in the right direction.
- The N, E, S, W `<div>` elements are the cardinal direction labels positioned around the circle using CSS.

---

## Lines 208–257 — Intelligence Panel
```html
<div class="card intelligence-card" id="intelligence-panel">
```
The intelligence panel holds 4 sections in a horizontal grid:

1. **Next Hour Prediction** — `id="intel-pred-temp"`, `id="intel-pred-condition"`, `id="intel-temp-direction"`
2. **Rain Chance** — `id="intel-rain-badge"`, `id="intel-rain-factors"`
3. **Stability** — `id="intel-stability-badge"`, `id="intel-stability-detail"`
4. **Smart Insights** — `id="intel-insight-list"` (a `<ul>` list)

Each of these IDs is targeted by JavaScript to fill in the data after it arrives from the server.

```html
<div class="anomaly-banner" id="anomaly-banner" style="display:none;">
    <i class="ri-alarm-warning-fill"></i>
    <span id="anomaly-banner-text">Anomaly Detected</span>
</div>
```
- The red/orange warning banner. Hidden by default (`display:none`). JavaScript shows this and updates the text when an anomaly (extreme heat, fog, etc.) is detected.

---

## Lines 260–296 — Forecast Section
```html
<canvas id="hourlyChart"></canvas>
```
- `<canvas>` = a blank drawing area. Chart.js draws the hourly temperature/precipitation/wind graph onto this canvas element using JavaScript. It's like a blank whiteboard that JavaScript paints on.

```html
<div class="daily-list" id="daily-list">
    <!-- Dynamic Content Here -->
</div>
```
- Empty container. JavaScript generates HTML for each day's forecast row and inserts it here dynamically.

---

## Lines 300–328 — Map View
```html
<div id="map-container" ...>
```
- Empty container. Leaflet.js (the map library) takes this `<div>` and fills it with an interactive map when the Map tab is opened.

---

## Lines 465–467 — Loading JavaScript
```html
<script type="module" src="script.js"></script>
```
- `<script>` = loads a JavaScript file.
- `type="module"` = loads it as an ES Module — this allows the use of `import` and `export` statements between files.
- `src="script.js"` = the file to load.
- **Why is this at the bottom of `<body>`?** — Because all the HTML elements above need to exist in the page before JavaScript tries to find them. If the script ran first, `getElementById('temperature')` would return null — the element wouldn't exist yet.

---

*Next: [02_css_explained.md](./02_css_explained.md)*
