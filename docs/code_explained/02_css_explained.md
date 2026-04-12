# 🎨 style.css — Line by Line

> CSS is the **painter** of your webpage. HTML built the skeleton, CSS paints colours, sets sizes, adds shadows, and makes everything look beautiful.

---

## What is CSS?

CSS = Cascading Style Sheets. Every CSS rule has two parts:
```css
selector {
    property: value;
}
```
- **Selector** = which HTML element(s) to style (e.g., `.card`, `body`, `#greeting`)
- **Property** = what to change (e.g., `color`, `font-size`, `background`)
- **Value** = what to change it to (e.g., `red`, `2rem`, `blue`)

**Cascading** means: if two rules target the same element, the more specific one wins. If equal, the later rule wins.

---

## Lines 1–22 — `:root` (The Design System Variables)

```css
:root {
    --bg-gradient: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    --accent: #4facfe;
    --accent-hover: #00f2fe;
    --danger: #ff4b2b;
    --card-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    --font-main: 'Outfit', sans-serif;
    --glass-bg: rgba(0, 0, 0, 0.4);
    --glass-border: 1px solid rgba(255, 255, 255, 0.1);
    --text-primary: #ffffff;
    --text-secondary: #a0a0b0;
    --highlight: rgba(255, 255, 255, 0.05);
    --sidebar-width: 250px;
    --gap: 24px;
    --radius: 20px;
}
```

**`:root`** = the very top of the HTML document (the `<html>` element). Variables defined here are available **everywhere** on the page.

**`--variable-name`** = a CSS Custom Property (variable). The `--` prefix is required. Use it anywhere with `var(--variable-name)`.

**Why use variables?** Instead of writing `#4facfe` 50 times, write it once here. To change the accent colour, change it in ONE place. Like a master settings panel.

| Variable | Meaning |
|---|---|
| `--bg-gradient` | The background: a diagonal gradient from deep purple → darker purple |
| `--accent` | The main highlight colour — a sky blue (`#4facfe`) |
| `--accent-hover` | A brighter blue shown when hovering |
| `--danger` | Red used for alerts and warnings |
| `--card-shadow` | Shadow beneath each card: `0 8px 32px` = offset 0 horizontal, 8px vertical, 32px blur |
| `--font-main` | The font family — Outfit (loaded from Google Fonts), fallback to sans-serif |
| `--glass-bg` | Card background: black at 40% transparency (`rgba(0,0,0,0.4)`) |
| `--glass-border` | Thin white semi-transparent border — creates the glassmorphism edge |
| `--text-primary` | Main text colour: pure white |
| `--text-secondary` | Subdued text: grey-purple (`#a0a0b0`) |
| `--sidebar-width` | How wide the sidebar is: 250px |
| `--radius` | Corner roundness of cards: 20px |

---

## Lines 24–39 — Theme Classes

```css
body.theme-dark {
    --glass-bg: rgba(0, 0, 0, 0.4);
    --text-primary: #ffffff;
    --text-secondary: #a0a0b0;
}

body.theme-light {
    --glass-bg: rgba(255, 255, 255, 0.3);
    --text-primary: #121212;
    --text-secondary: #333333;
}
```

When the `<body>` has class `theme-dark` → dark theme variable values are applied.
When JavaScript changes it to `theme-light` → the light theme variables override the `:root` defaults.

This is how one-click theme switching works: JavaScript just changes one class on `<body>`, and CSS automatically updates everything through the variables.

---

## Lines 41–46 — Universal Reset

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: var(--font-main);
}
```

`*` = the universal selector. Matches EVERY single element on the page.

- `margin: 0` — Browsers add default margins to headings, paragraphs, lists. This removes all of them.
- `padding: 0` — Same for padding.
- `box-sizing: border-box` — Changes how widths are calculated. Normally `width: 200px` + `padding: 10px` = 220px total. With `border-box`, padding is included INSIDE the 200px. This prevents layout surprises.
- `font-family: var(--font-main)` — Every element uses the Outfit font by default.

> **Analogy:** Like cleaning a white canvas before painting. Remove all the browser's default artistic choices first.

---

## Lines 48–58 — Body Styling

```css
body {
    background: var(--bg-gradient);
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    transition: background-image 1s ease-in-out;
    min-height: 100vh;
    color: var(--text-primary);
    overflow-x: hidden;
}
```

- `background: var(--bg-gradient)` — Applies the purple diagonal gradient as the page background.
- `background-size: cover` — Scales the background to cover the entire screen without gaps.
- `background-attachment: fixed` — The background stays in place as you scroll (parallax effect).
- `transition: background-image 1s ease-in-out` — Smoothly fades the background when it changes (e.g., theme switch).
- `min-height: 100vh` — Minimum height = 100% of the viewport height. The page always fills the screen.
- `color: var(--text-primary)` — Default text colour for the entire page: white.
- `overflow-x: hidden` — Prevents horizontal scrollbar from appearing due to layout overflow.

---

## Lines 61–64 — App Container

```css
.app-container {
    display: flex;
    min-height: 100vh;
}
```

- `display: flex` — Makes children line up side-by-side (sidebar + main content side by side).
- `min-height: 100vh` — The container fills the full screen height.

> **Flexbox** is a CSS layout system. `display: flex` on a parent makes children automatically arrange themselves in a row (or column if specified).

---

## Lines 67–77 — Sidebar

```css
.sidebar {
    width: var(--sidebar-width);  /* 250px */
    padding: 30px;
    background: #0f0c29;
    border-right: var(--glass-border);
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    z-index: 100;
}
```

- `width: 250px` — The sidebar is always 250px wide.
- `padding: 30px` — 30px of empty space inside the sidebar on all sides.
- `background: #0f0c29` — Very dark navy/purple background.
- `border-right` — Thin white semi-transparent line on the right edge.
- `display: flex; flex-direction: column` — Contents stack vertically (logo on top, then nav links below).
- `position: fixed` — The sidebar stays in place even when you scroll the main content.
- `height: 100vh` — Sidebar always fills the full screen height.
- `z-index: 100` — Sits on top of other elements (higher number = on top).

---

## Lines 95–111 — Sidebar Navigation Links

```css
.sidebar nav a {
    text-decoration: none;
    color: #ffffff;
    font-size: 1.1rem;
    padding: 15px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 15px;
    transition: all 0.3s ease;
}

.sidebar nav a:hover, .sidebar nav a.active {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
```

- `text-decoration: none` — Removes the underline from links.
- `border-radius: 12px` — Rounded corners on the link buttons.
- `display: flex; align-items: center; gap: 15px` — Icon and text sit side by side with 15px gap.
- `transition: all 0.3s ease` — Any property change (like background colour on hover) animates smoothly over 0.3 seconds.
- `:hover` pseudo-class — Applies styles when the mouse is over the element.
- `a.active` — When the link has the `active` class (current page), it gets a subtle white background.

---

## Lines 114–124 — Main Content Area

```css
.main-content {
    flex: 1;
    margin-left: var(--sidebar-width);
    padding: 30px;
    max-width: 1600px;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    gap: 30px;
}
```

- `flex: 1` — Takes all remaining horizontal space after the sidebar.
- `margin-left: 250px` — Pushes content right to make room for the fixed sidebar.
- `padding: 30px` — 30px spacing around all content.
- `max-width: 1600px; margin-right: auto` — On very wide screens, content won't stretch beyond 1600px; it centres automatically.
- `gap: 30px` — 30px space between each child section (hero header, search bar, dashboard, etc.).

---

## Lines 175–185 — Clock Widget (Glassmorphism)

```css
.clock-widget {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--glass-bg);
    padding: 10px 18px;
    border-radius: 50px;
    border: var(--glass-border);
    backdrop-filter: blur(10px);
    flex-shrink: 0;
}
```

- `border-radius: 50px` — Fully pill-shaped (because 50px > half the height).
- `backdrop-filter: blur(10px)` — **This is glassmorphism!** Blurs whatever is behind the element, creating a frosted-glass effect.
- `background: rgba(0,0,0,0.4)` — Semi-transparent background. Combined with blur, creates the glass look.
- `flex-shrink: 0` — Prevents the clock widget from shrinking when the search bar needs space.

---

## Lines 209–221 — Analog Clock Hands

```css
.analog-clock .hand {
    position: absolute;
    bottom: 50%;
    left: 50%;
    transform-origin: bottom center;
    background: var(--text-primary);
    border-radius: 4px;
    transform: translateX(-50%) rotate(0deg);
}

.hour-hand { width: 2.5px; height: 10px; z-index: 3; }
.min-hand  { width: 1.5px; height: 14px; z-index: 4; }
.sec-hand  { width: 1px;   height: 16px; background: #ff4757 !important; z-index: 5; }
```

- `position: absolute` — Position relative to the parent clock face.
- `bottom: 50%` — The bottom end of the hand is at the centre of the clock.
- `left: 50%` — Horizontally centred.
- `transform-origin: bottom center` — Rotation pivots from the bottom (the centre pin of the clock).
- `transform: translateX(-50%)` — Shifts left by 50% of own width to truly centre it.
- `rotate(0deg)` — JavaScript changes this in real time to rotate the hand.
- The three hands differ in width and height — the second hand is thinnest but tallest, and red.

---

## Lines 336–343 — Card Base Style

```css
.card {
    background: var(--glass-bg);
    border: var(--glass-border);
    backdrop-filter: blur(10px);
    border-radius: var(--radius);
    box-shadow: var(--card-shadow);
    padding: 25px;
}
```

Every card on the dashboard uses this class. This is the glassmorphism card style:
- Semi-transparent background
- Blurred backdrop
- Rounded corners
- Subtle shadow
- Thin white border

---

## Lines 355–358 — View Section Animations

```css
.view-section {
    display: none;
    animation: fadeIn 0.4s ease;
}

.view-section.active {
    display: block;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
}
```

- `display: none` — All views are hidden by default.
- `.view-section.active` — Only the active view is shown.
- `@keyframes fadeIn` — Defines a smooth animation: starts transparent and 10px down, ends fully visible at original position. This runs each time a view becomes active (0.4 seconds, `ease` curve).

---

## Lines 361–367 — Dashboard Grid

```css
.dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 20px;
    align-items: start;
}
```

- `display: grid` — CSS Grid layout: the most powerful layout system in CSS.
- `grid-template-columns: 2fr 1fr 1fr` — Three columns. `fr` = fraction of available space. Column 1 gets 2/4 = 50%, columns 2 and 3 each get 1/4 = 25%.
- `gap: 20px` — 20px space between grid cells.
- `align-items: start` — Cards in the same row don't stretch to equal height; they align to the top.

---

## Lines 600–620 — CSS Water Drop (Humidity)

```css
.water-drop {
    width: 28px;
    height: 28px;
    border-radius: 0 50% 50% 50%;
    border: 2px solid var(--accent);
    transform: rotate(45deg);
    overflow: hidden;
}

.water-drop::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: var(--fill, 0%);
    background: radial-gradient(circle at bottom, #4facfe, #00cdac);
    transition: height 0.5s ease-out;
}
```

This is a pure CSS water drop — no image used!

- `border-radius: 0 50% 50% 50%` — Makes a teardrop shape: top-left is sharp (0%), other three corners are fully round.
- `transform: rotate(45deg)` — Rotates 45° so the sharp corner points up (like a water drop falling).
- `overflow: hidden` — Clips the fill inside the drop shape.
- `::before` — A **pseudo-element**: a fake extra element created by CSS without any HTML. Used to create the fill inside the drop.
- `height: var(--fill, 0%)` — JavaScript sets `--fill` to the humidity percentage (e.g., `--fill: 72%`). The blue fill rises to that height inside the drop.
- `transition: height 0.5s ease-out` — Fill height animates smoothly when humidity changes.

---

## Lines 632–662 — Wind Rose (Compass)

```css
.wind-rose .needle {
    width: 3px;
    height: 42px;
    background: linear-gradient(to top, transparent 50%, #ff4b2b 50%);
    transform: rotate(var(--rotation, 0deg));
    transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
}
```

- `background: linear-gradient(to top, transparent 50%, #ff4b2b 50%)` — The bottom half of the needle is transparent; the top half is red. This means only the top half (pointing direction) is visible.
- `transform: rotate(var(--rotation))` — JavaScript sets `--rotation` to the actual wind degree (e.g., `135deg` for SE wind).
- `transition: transform 1s cubic-bezier(...)` — The needle rotates smoothly in 1 second using a natural easing curve.

---

## Lines 481–487 — Responsive: Mobile

```css
@media (max-width: 900px) {
    .current-weather {
        grid-column: span 1;
        flex-direction: column;
        text-align: center;
    }
}
```

`@media (max-width: 900px)` = "Apply these rules ONLY when the screen is 900px wide or narrower (tablet/mobile)."

On small screens, the weather hero card spans only 1 column (not 3) and stacks vertically.

---

*Next: [03_scriptjs_explained.md](./03_scriptjs_explained.md)*
