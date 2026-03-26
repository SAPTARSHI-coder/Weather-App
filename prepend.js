const fs = require('fs');

const htmlComment = `<!--
================================================================================
🌤️ SKYGLASS WEATHER SYSTEM - index.html
================================================================================
WHAT THIS FILE DOES:
This is the main structure (skeleton) of the website. It defines where all the
text, images, and layout boxes (cards) go.

HOW IT WORKS:
- Contains the search bar to find cities.
- Has empty placeholders (like id="temperature") that get filled by script.js.
- Links to style.css for colors/layout and script.js for interactive logic.
================================================================================
-->\n`;

const cssComment = `/*
================================================================================
🌤️ SKYGLASS WEATHER SYSTEM - style.css
================================================================================
WHAT THIS FILE DOES:
This is the "paint and layout" of the website. It takes the plain HTML skeleton
and makes it look beautiful, specifically giving it the responsive "glassmorphism" look.

HOW IT WORKS:
- Defines colors, fonts, and smooth animations (like hovering over buttons).
- Controls the "grid" layout so the cards fit nicely on both phones and big screens.
================================================================================
*/\n`;

const scriptComment = `/**
 * ============================================================================
 * 🌤️ SKYGLASS WEATHER SYSTEM - script.js
 * ============================================================================
 * WHAT THIS FILE DOES:
 * This is the "brain" of the frontend user interface. It detects when a user
 * types a city, fetches the data from our backend server, and updates the HTML.
 * 
 * HOW IT WORKS FOR BEGINNERS:
 * 1. The user types a city in the search bar.
 * 2. script.js asks the backend server.js: "Hey, give me weather for London".
 * 3. The server sends back a single JSON object with all the temperature, rain,
 *    and prediction data.
 * 4. We find the exact HTML boxes (like document.getElementById('temperature'))
 *    and specifically change their internal text to the new data.
 * ============================================================================
 */\n`;

const serverComment = `/**
 * ============================================================================
 * 🌤️ SKYGLASS WEATHER SYSTEM - server.js (The Backend)
 * ============================================================================
 * WHAT THIS FILE DOES:
 * This is a Node.js Express server. It acts as a secure middleman between our
 * website front-end and the raw data APIs (WeatherAPI & Open-Meteo).
 * 
 * WHY WE NEED THIS FILE:
 * - SECURITY: We NEVER put secret API keys in \`script.js\` because hackers can
 *   see them in the browser. The server hides them in a .env file.
 * - PROCESSING: It takes messy data from 2 different APIs, passes it through
 *   our "Intelligence Engines" to create smart predictions, and sends ONE clean
 *   data package back to the website.
 * ============================================================================
 */\n`;

function prepend(file, comment) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (!content.includes('🌤️ SKYGLASS WEATHER SYSTEM')) {
            fs.writeFileSync(file, comment + content);
            console.log('Commented: ' + file);
        }
    }
}

prepend('index.html', htmlComment);
prepend('style.css', cssComment);
prepend('script.js', scriptComment);
prepend('server.js', serverComment);
