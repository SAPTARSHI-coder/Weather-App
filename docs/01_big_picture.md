# 🌤️ SkyGlass — The Big Picture (For Absolute Beginners)

> Read this first. Before any code, before any file name. Just understand the idea.

---

## 🤔 What Problem Does This Solve?

Imagine you wake up in the morning. You want to know:
- *"Should I carry an umbrella today?"*
- *"Is it safe to go for a run? Is the air clean?"*
- *"Will it get hotter later, or cooler?"*

You open a normal weather app on your phone. It shows you: **28°C, Partly Cloudy**.

That's it. That's all you get.

But that single number came from **just one weather service**. And weather services aren't always right. Sometimes they disagree. Sometimes they're wrong for your specific city. And they give you **no explanation** — just a number and a cloud icon.

**SkyGlass solves this.**

---

## 💡 What SkyGlass Actually Does (In Plain English)

Imagine instead of asking one doctor about your health, you:

1. **Ask two different doctors** (two weather services)
2. **Compare their answers** — if they agree, great. If they disagree, investigate why.
3. **Run 12 different lab tests** on the combined result (rain probability, air quality, danger detection, etc.)
4. **Get a full report** in plain language — *"Heavy rain likely in 2 hours. Air quality is poor. Take an umbrella and a mask."*

That is exactly what SkyGlass does, but for weather data.

---

## 🌍 Why Does This Matter in Real Life?

| Situation | Normal App | SkyGlass |
|---|---|---|
| Farmer deciding to water crops | Shows "28°C" | Shows rain probability + pressure trend |
| Parent sending child to school | Shows "Partly Cloudy" | Shows UV index + air quality health tips |
| Driver in fog | Shows nothing | Shows visibility warning alerts |
| Hiker planning tomorrow | 3-day forecast only | 7-day extended forecast |
| Asthmatic checking air | No info | AQI score + "Avoid outdoor activity" tip |

---

## 🏗️ In One Sentence

> **SkyGlass is a weather intelligence system that fetches data from two sources, fuses them mathematically, runs 12 analysis engines, and delivers a rich, reliable, human-readable weather report — all in under one second.**

---

## 🔢 By The Numbers

| What | Count |
|---|---|
| Weather APIs used | 3 (WeatherAPI, Open-Meteo, OpenWeatherMap) |
| Intelligence engines | 12 |
| Forecast days covered | 7 |
| History days available | 7 (past) |
| Response fields generated | ~40 |
| API keys exposed to user | 0 (all protected on server) |

---

*Next: [02_full_flow.md](./02_full_flow.md) — The Full Story, Step by Step*
