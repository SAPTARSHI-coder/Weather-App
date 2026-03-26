# 🌤️ SkyGlass Weather System: Project Overview

Welcome to the SkyGlass Weather System! This document is written for beginners to understand exactly how this project works, what each file does, and why it is needed.

## 🏗️ Architecture Overview
SkyGlass is a full-stack web application. That means it has two main parts:
1. **Frontend (The User Interface):** What you see in the browser. It runs on HTML, CSS, and JavaScript.
2. **Backend (The Server):** A Node.js application that runs on your computer (or a server). It securely talks to external weather APIs and calculates predictions before sending the final data to the frontend.

---

## 📂 File Structure & Explanations

### 🖥️ Frontend Files (User Interface)

*   **`index.html`**
    *   **What it does:** The skeleton of the website. It defines where every button, card, and image goes.
    *   **Why we need it:** Without HTML, the browser wouldn't know what to display on the screen.

*   **`style.css`**
    *   **What it does:** The "paint" and "layout" of the website. It contains rules for colors, spacing, animations, and the glowing "glassmorphism" effects.
    *   **Why we need it:** To make the structural HTML look beautiful and ensure it shrinks/expands properly on mobile phones and wide monitors.

*   **`script.js`**
    *   **What it does:** The brain of the frontend. It listens to user clicks (like searching for a city), asks the backend for weather data, and manually updates the HTML to show the new temperatures and charts.
    *   **Why we need it:** To make the website interactive. Without it, the website would just be a static picture that never updates.

### ⚙️ Backend Files (Server & Brain)

*   **`server.js`**
    *   **What it does:** The main entry point for the backend. It sets up an Express.js server that listens for requests from the frontend (like "Get me the weather for London"). It safely holds secret API keys and fetches raw data from WeatherAPI and Open-Meteo.
    *   **Why we need it:** Browsers shouldn't hold secret API keys (hackers could steal them). The server acts as a secure middleman.

*   **`package.json` & `package-lock.json`**
    *   **What it does:** A list of all the external tools (dependencies) this project needs to run (like Express, Axios, Vite).
    *   **Why we need it:** So when another developer downloads this project, they can just type `npm install` to download all exactly required tools.

---

### 🧠 The Intelligence Engines (`src/weatherEngine/`)
Instead of just showing raw weather data, SkyGlass "thinks" about the data. We split this logic into separate "Engines" so the code stays organized.

*   **`fusionEngine.js`**
    *   **What it does:** Takes messy, raw data from multiple different APIs and combines (fuses) them into one clean, standardized object.
    *   **Why we need it:** frontend shouldn't have to guess how to read 3 different API formats. It just wants one clean answer.

*   **`trendEngine.js`**
    *   **What it does:** Keeps a short-term memory (a buffer) of the last few hours of weather. It calculates whether temperatures are rising or falling.
    *   **Why we need it:** To know if a storm is approaching or if it's getting hotter, we must look at the *past* to understand the *trajectory*.

*   **`predictionEngine.js`**
    *   **What it does:** Uses math and the trends from `trendEngine` to guess what the temperature and conditions will be exactly 1 hour from now.
    *   **Why we need it:** To give the user a peek into the immediate future ("Next Hour" predictions).

*   **`insightEngine.js`**
    *   **What it does:** Looks at all the data and generates human-readable sentences (e.g., "High humidity detected" or "Perfect weather conditions").
    *   **Why we need it:** To provide conversational, easy-to-read summaries that instantly warn a user about dangerous conditions like low visibility.

*   **`anomalyEngine.js`**
    *   **What it does:** Scans the data for extreme, unlikely situations (like 50°C heat or sudden massive pressure drops).
    *   **Why we need it:** To trigger the bright red "Anomaly Detected" banner in emergency situations.

*   **`rainEngine.js` & `stabilityEngine.js`**
    *   **What they do:** Specialized calculators. `rainEngine` determines the exact percentage chance of rain based on clouds and humidity. `stabilityEngine` decides if the atmosphere is calm or turbulent.
    *   **Why we need them:** To feed accurate sub-metrics into the Intelligence panel on the dashboard.

---
*Created as a beginner-friendly guide to mastering the SkyGlass architecture.*
