import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import 'leaflet/dist/leaflet.css'; // Leaflet Styles
import L from 'leaflet';
import { initMap, updateMap, resizeMap } from './mapUtils.js';
import { saveCity, getSavedCities, removeCity } from './storageUtils.js';

// Register the plugin
Chart.register(ChartDataLabels);

// DOM Elements
const currentDateEl = document.getElementById('current-date');
const dailyListEl = document.getElementById('daily-list');
const hourlyCtx = document.getElementById('hourlyChart').getContext('2d');
const citySearch = document.getElementById('city-search');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const historyListEl = document.getElementById('history-list');

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function fetchWithRetry(url, options = {}, retries = 2, timeoutMs = 5000) {
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(`${API_BASE_URL}${url}`, { ...options, signal: controller.signal });
            clearTimeout(id);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
        } catch (error) {
            clearTimeout(id);
            if (i === retries) throw error;
            console.warn(`[Frontend] Fetch retry ${i+1}/${retries} for ${url}`);
        }
    }
}

function showDashboardState(state, message = "") {
    const overlay = document.getElementById('dashboard-state-overlay');
    const grid = document.getElementById('main-dashboard-grid');
    const panel = document.getElementById('intelligence-panel');
    const forecasts = document.getElementById('main-forecasts-grid');
    
    if (!overlay) return;
    
    const icon = document.getElementById('dashboard-state-icon');
    const text = document.getElementById('dashboard-state-text');
    
    if (state === 'loading') {
        overlay.style.display = 'flex';
        icon.className = 'ri-loader-4-line ri-spin';
        icon.style.color = 'var(--text-secondary)';
        text.textContent = message || 'Loading weather data...';
        text.style.color = 'var(--text-secondary)';
        if (grid) grid.style.display = 'none';
        if (panel) panel.style.display = 'none';
        if (forecasts) forecasts.style.display = 'none';
    } else if (state === 'error') {
        overlay.style.display = 'flex';
        icon.className = 'ri-error-warning-line';
        icon.style.color = '#ff6b6b';
        text.textContent = message || 'Unable to fetch data. Please try again.';
        text.style.color = '#ff6b6b';
        if (grid) grid.style.display = 'none';
        if (panel) panel.style.display = 'none';
        if (forecasts) forecasts.style.display = 'none';
    } else {
        // Success
        overlay.style.display = 'none';
        if (grid) grid.style.display = '';
        if (panel) panel.style.display = '';
        if (forecasts) forecasts.style.display = '';
    }
}

function safeVal(val) {
    return (val === null || val === undefined) ? "Data unavailable" : val;
}

let weatherChart;
let fullForecastData = []; 
let currentCityData = null; // Store current city for saving
let isMapInitialized = false;
let currentForecastDuration = 6;
let currentForecastMetric = 'temperature';
let rawForecastData = null; 
let currentDailyType = 'future';

// ── City Clock ────────────────────────────────────────────────────────────────
let cityClockInterval = null;
let cityClocktimezone = null; // IANA timezone string, e.g. 'Europe/London'

function startCityClock(tzId, cityLabel) {
    if (cityClockInterval) clearInterval(cityClockInterval);
    cityClocktimezone = tzId;

    const labelEl = document.getElementById('city-clock-label');
    if (labelEl) labelEl.textContent = cityLabel + ' Time';

    const tzShort = tzId.split('/').pop().replace(/_/g, ' ');
    const tzEl = document.getElementById('city-clock-tz');
    if (tzEl) tzEl.textContent = tzId.replace(/_/g, ' ');

    function tick() {
        try {
            const now = new Date();
            const cityTime = new Date(now.toLocaleString('en-US', { timeZone: tzId }));

            const h12 = cityTime.getHours() % 12 || 12;
            const min = cityTime.getMinutes();
            const sec = cityTime.getSeconds();
            const ampm = cityTime.getHours() >= 12 ? 'PM' : 'AM';

            // Digital
            const timeEl = document.getElementById('city-clock-time');
            const ampmEl = document.getElementById('city-clock-ampm');
            if (timeEl) timeEl.textContent = `${String(h12).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
            if (ampmEl) ampmEl.textContent = ampm;

            // Analog hands
            const secDeg = sec * 6;
            const minDeg = min * 6 + sec * 0.1;
            const hrDeg  = (cityTime.getHours() % 12) * 30 + min * 0.5;

            const sH = document.getElementById('city-sec-hand');
            const mH = document.getElementById('city-min-hand');
            const hH = document.getElementById('city-hour-hand');
            if (sH) sH.style.transform = `translateX(-50%) rotate(${secDeg}deg)`;
            if (mH) mH.style.transform = `translateX(-50%) rotate(${minDeg}deg)`;
            if (hH) hH.style.transform = `translateX(-50%) rotate(${hrDeg}deg)`;
        } catch (e) {
            console.warn('City clock tick error:', e);
        }
    }
    tick();
    cityClockInterval = setInterval(tick, 1000);
}

// -- Initialization --
function init() {
    updateClock();
    setInterval(updateClock, 1000); // 1s tick
    
    // Auto-Location with better error handling
    if (navigator.geolocation) {
        document.body.style.cursor = 'wait';
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (hasUserSearched) return; // Prevent shifting if user already searched
                const { latitude, longitude } = pos.coords;
                console.log(`Location found: ${latitude}, ${longitude}`);
                loadCity(`${latitude},${longitude}`);
            }, 
            (err) => {
                if (hasUserSearched) return; // Prevent shifting
                console.warn("Location access denied or error:", err.message);
                loadCity('Kolkata'); // Default fallback
                alert("Could not access your location. Defaulting to Kolkata.");
            },
            {
                timeout: 10000,
                enableHighAccuracy: true
            }
        );
    } else {
        console.warn("Geolocation not supported");
        loadCity('Kolkata');
    }
    
// Global flag to prevent late geolocation callbacks from overriding user searches
let hasUserSearched = false;

// Event Listeners
const searchInput = document.getElementById('city-search');
const searchBtn = document.getElementById('search-btn');

searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        hasUserSearched = true;
        document.getElementById('search-suggestions').classList.add('hidden');
        loadCity(city);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) {
            hasUserSearched = true;
            document.getElementById('search-suggestions').classList.add('hidden');
            loadCity(city);
        }
    }
});
    
    // Autocomplete Logic
    let searchTimeout;
    const suggestionsBox = document.getElementById('search-suggestions');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);
        
        if (query.length < 3) {
            suggestionsBox.classList.add('hidden');
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                const data = await fetchWithRetry(`/api/search?q=${encodeURIComponent(query)}`);
                
                if (data && data.length > 0) {
                    suggestionsBox.innerHTML = '';
                    data.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = `${item.name}, ${item.country}`;
                        li.addEventListener('click', () => {
                            hasUserSearched = true;
                            searchInput.value = item.name;
                            suggestionsBox.classList.add('hidden');
                            loadCity(item.name);
                        });
                        suggestionsBox.appendChild(li);
                    });
                    suggestionsBox.classList.remove('hidden');
                } else {
                    suggestionsBox.classList.add('hidden');
                }
            } catch (err) {
                console.error('Search autocomplete error:', err);
            }
        }, 300); // 300ms debounce
    });
    
    // Hide suggestions on outside click
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.add('hidden');
        }
    });

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 900 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target) &&
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
    
    // View Navigation Logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            viewSections.forEach(section => section.classList.remove('active'));
            viewSections.forEach(section => section.style.display = 'none'); // Explicit hide
            
            const targetId = btn.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block'; // Explicit show first
                // A small delay to allow transition if any, but mainly for Leaflet to detect size
                setTimeout(() => {
                    targetSection.classList.add('active');
                    
                    // Map Specific Logic
                    if (targetId === 'map-view') {
                        // If map needs initialization (first time view)
                         if (!isMapInitialized && currentCityData) {
                             const container = document.getElementById('map-container');
                             container.innerHTML = ''; // Clear placeholder
                             
                             initMap(container, currentCityData.lat, currentCityData.lon);
                             isMapInitialized = true;
                         }
                         resizeMap();
                    }
                    
                    // Saved Specific Logic
                    if (targetId === 'saved-view') {
                        renderSavedList();
                    }

                    // History Specific Logic
                    if (targetId === 'history-view') {
                        if (currentCityData) {
                            loadHistory(currentCityData.name);
                        } else {
                            historyListEl.innerHTML = '<div class="daily-item"><p>Please select a city first.</p></div>';
                        }
                    }
                }, 10);
            }
        });
    });

    // Double click to save
    const cityNameEl = document.getElementById('city-name');
    if (cityNameEl) {
        cityNameEl.title = "Double-click to save to favorites";
        cityNameEl.style.cursor = 'pointer';
        cityNameEl.addEventListener('dblclick', () => {
             if (currentCityData) {
                 const saved = saveCity(currentCityData);
                 if (saved) {
                     alert(`${currentCityData.name} saved to favorites!`);
                 } else {
                     alert(`${currentCityData.name} is already saved.`);
                 }
             }
        });
    }

    // Hourly Forecast Toggles
    const metricBtns = document.querySelectorAll('#metric-toggles .toggle-btn');
    const durationBtns = document.querySelectorAll('#duration-toggles .toggle-btn');
    
    metricBtns.forEach(btn => {
        btn.addEventListener('click', () => {
             metricBtns.forEach(b => b.classList.remove('active'));
             btn.classList.add('active');
             currentForecastMetric = btn.dataset.metric;
             renderHourlyChart();
        });
    });
    
    durationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
             durationBtns.forEach(b => b.classList.remove('active'));
             btn.classList.add('active');
             currentForecastDuration = parseInt(btn.dataset.duration, 10);
             renderHourlyChart();
        });
    });

    // Daily Forecast Past/Future Toggles
    const dailyBtns = document.querySelectorAll('#daily-toggles .toggle-btn');
    dailyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dailyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDailyType = btn.dataset.type;
            
            if (currentDailyType === 'past') {
                if (currentCityData) loadPastDailyForecast(currentCityData.name);
            } else {
                renderForecast();
            }
        });
    });

    // Initial Load of Saved Cities
    renderSavedList();
}

// Top summary bar was removed

function updateClock() {
    const now = new Date();
    
    // Digital Time HH:MM AM/PM
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-US', { 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit'
        });
    }
    
    // Analog Clock Hands
    const s = now.getSeconds();
    const m = now.getMinutes();
    const h = now.getHours() % 12;
    
    const secDeg = s * 6;               // 360 / 60
    const minDeg = (m * 6) + (s * 0.1); // 360 / 60 + subtle second shift
    const hrDeg = (h * 30) + (m * 0.5); // 360 / 12 + subtle minute shift
    
    const secHand = document.getElementById('sec-hand');
    const minHand = document.getElementById('min-hand');
    const hrHand = document.getElementById('hour-hand');
    
    if (secHand) secHand.style.transform = `translateX(-50%) rotate(${secDeg}deg)`;
    if (minHand) minHand.style.transform = `translateX(-50%) rotate(${minDeg}deg)`;
    if (hrHand) hrHand.style.transform = `translateX(-50%) rotate(${hrDeg}deg)`;
    
    // GMT Time
    const gmtEl = document.getElementById('gmt-time');
    if (gmtEl) {
        // e.g., 07:30 GMT
        const gmtStr = now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
        gmtEl.textContent = `GMT ${gmtStr}`;
    }
    
    // Date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    if (currentDateEl) {
        currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
    
    // Greeting
    const hrs = now.getHours();
    let greet;

if (hrs >= 5 && hrs < 12) {
  greet = "Good Morning";
} else if (hrs >= 12 && hrs < 17) {
  greet = "Good Afternoon";
} else if (hrs >= 17 && hrs < 21) {
  greet = "Good Evening";
} else {
  greet = "Good Night";
}

    const greetEl = document.getElementById('greeting');
    if (greetEl) greetEl.textContent = greet;
}

// -- API Integration --

async function loadCity(query) {
    showDashboardState('loading');
    document.body.style.cursor = 'wait';
    try {
        let fetchUrl;
        if (query.includes(',')) {
            const [lat, lon] = query.split(',');
            fetchUrl = `/api/weather?lat=${lat.trim()}&lon=${lon.trim()}`;
        } else {
            fetchUrl = `/api/weather?q=${encodeURIComponent(query)}`;
        }

        const data = await fetchWithRetry(fetchUrl);
        if (!data || !data.success) throw new Error(data?.message || 'City not found');
        
        updateUI(data.data.raw, data.data);
        showDashboardState('success');
        
    } catch (error) {
        console.error(error);
        if (error.message.includes("City not found")) {
            showDashboardState('error', "Location data unavailable");
        } else {
            showDashboardState('error');
        }
    } finally {
        document.body.style.cursor = 'default';
        citySearch.value = '';
    }
}

async function loadHistory(cityName) {
    const listEl = document.getElementById('history-picker');
    const containerEl = document.getElementById('hist-grid-container');
    const loadingEl = document.getElementById('hist-loading');
    
    if (!listEl) return;
    listEl.innerHTML = '<span style="color:#aaa; padding:10px;">Loading historical data...</span>';
    containerEl.style.display = 'none';
    loadingEl.style.display = 'block';

    const dates = [];
    for (let i = 1; i <= 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
    }

    try {
        const promises = dates.map(dt => fetchWithRetry(`/api/history?q=${encodeURIComponent(cityName)}&dt=${dt}`));
        const settled = await Promise.allSettled(promises);
        const results = settled.filter(res => res.status === 'fulfilled').map(res => res.value);

        listEl.innerHTML = ''; // Clear loading

        const validDays = [];
        results.forEach(data => {
            if (data.forecast && data.forecast.forecastday && data.forecast.forecastday[0]) {
                const dayObj = data.forecast.forecastday[0];
                dayObj._city = cityName; // manually pass city context
                validDays.push(dayObj);
            }
        });

        if (results.length === 0) {
            listEl.innerHTML = '<span style="color:#aaa; padding:10px;">No history available.</span>';
            loadingEl.innerHTML = '<p>No historical data available.</p>';
            return;
        }

        // ── Fetch Historical AQI from Open-Meteo (since WeatherAPI omits it) ──
        try {
            const { lat, lon } = currentCityData;
            // Get past 14 days AQI in one call
            const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi,carbon_monoxide&past_days=14`);
            if (aqiRes.ok) {
                const aqiData = await aqiRes.json();
                const times = aqiData.hourly.time;
                const usAqi = aqiData.hourly.us_aqi;
                const co = aqiData.hourly.carbon_monoxide;

                // Attach to validDays
                validDays.forEach(day => {
                    const dayDate = day.date; // YYYY-MM-DD
                    // Find indices matching this day
                    const dayIndices = times.map((t, i) => t.startsWith(dayDate) ? i : -1).filter(i => i !== -1);
                    if (dayIndices.length > 0) {
                        const dayAqis = dayIndices.map(i => usAqi[i]).filter(x => x != null);
                        const dayCos = dayIndices.map(i => co[i]).filter(x => x != null);
                        if (dayAqis.length > 0) {
                            // Assign max AQI and avg CO directly to the day object for the renderer
                            day._openMeteoAqi = Math.max(...dayAqis);
                            day._openMeteoCo = Math.round(dayCos.reduce((a,b)=>a+b,0)/dayCos.length);
                        }
                    }
                });
            }
        } catch(e) { console.warn("Could not fetch historical AQI", e); }

        // Render Day Chips
        validDays.forEach((day, index) => {
            const chip = document.createElement('div');
            chip.className = 'history-day-chip';
            if (index === 0) chip.classList.add('active'); // auto-select first day

            const dObj = new Date(day.date);
            const shortStr = dObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            chip.innerHTML = `
                <div class="chip-date">${shortStr}</div>
                <div class="chip-temp">${Math.round(day.day.avgtemp_c)}°</div>
            `;

            chip.addEventListener('click', () => {
                document.querySelectorAll('.history-day-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                renderHistoryDashboard(day);
            });

            listEl.appendChild(chip);
        });

        // Hide loading, show grid, render first day
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';
        renderHistoryDashboard(validDays[0]);

    } catch (err) {
        console.error("History Error:", err);
        listEl.innerHTML = '<span style="color:#ff6b6b; padding:10px;">Error loading history.</span>';
        loadingEl.innerHTML = '<p>Error loading historical dashboard.</p>';
    }
}

function renderHistoryDashboard(dayData) {
    const day = dayData.day;
    const astro = dayData.astro;
    const hours = dayData.hour || [];

    // Current Weather Hero
    document.getElementById('hist-city-name').textContent = dayData._city;
    document.getElementById('hist-temperature').textContent = `${Math.round(day.avgtemp_c)}°C`;
    document.getElementById('hist-condition').textContent = day.condition.text;
    document.getElementById('hist-feels-like').textContent = `High: ${day.maxtemp_c}° / Low: ${day.mintemp_c}°`;

    // Visual Icon
    const iconEl = document.getElementById('hist-weather-icon');
    if (iconEl) {
        const cond = day.condition.text.toLowerCase();
        if (cond.includes('rain') || cond.includes('drizzle')) iconEl.className = 'ri-heavy-showers-line huge-icon';
        else if (cond.includes('cloud') || cond.includes('overcast')) iconEl.className = 'ri-cloudy-line huge-icon';
        else if (cond.includes('sunny') || cond.includes('clear')) iconEl.className = 'ri-sun-line huge-icon';
        else iconEl.className = 'ri-sun-cloudy-line huge-icon';
    }

    // Wind
    document.getElementById('hist-wind-status').innerHTML = `${day.maxwind_kph} <small>km/h</small>`;
    const histRose = document.getElementById('hist-wind-rose');
    const avgWindDeg = hours.length > 0
        ? Math.round(hours.reduce((s, h) => s + (h.wind_degree || 0), 0) / hours.length)
        : null;
    if (histRose && avgWindDeg !== null) histRose.style.setProperty('--rotation', `${avgWindDeg}deg`);
    const avgWindDir = hours.length > 0 ? (hours[12] || hours[hours.length - 1]).wind_dir : 'N/A';
    document.getElementById('hist-wind-dir').textContent = `Direction: ${avgWindDir}`;

    // AQI – use Open-Meteo historical values if available
    let aqiVal = null;
    let coAvg = 0;

    if (day._openMeteoAqi != null) {
        aqiVal = day._openMeteoAqi;
        coAvg = day._openMeteoCo || 0;
    } else {
        // Fallback to hourly if WeatherAPI magically provided it
        const hourlyAqiVals = hours.map(h => h.air_quality?.['us-epa-index']).filter(v => v != null);
        const hourlyCoVals = hours.map(h => h.air_quality?.co).filter(v => v != null);
        const aqiMap = {1: 30, 2: 70, 3: 130, 4: 180, 5: 250, 6: 350};
        
        if (hourlyAqiVals.length > 0) {
            const maxEpa = Math.max(...hourlyAqiVals);
            aqiVal = aqiMap[maxEpa] || 50;
            coAvg = hourlyCoVals.length > 0 ? Math.round(hourlyCoVals.reduce((a, b) => a + b, 0) / hourlyCoVals.length) : 0;
        }
    }

    if (aqiVal !== null) {
        document.getElementById('hist-aqi-value').textContent = aqiVal;
        document.getElementById('hist-co-level').textContent = `CO: ${coAvg} µg/m³`;

        const aqiInfo = getAqiStatus(aqiVal);
        document.getElementById('hist-aqi-status').textContent = aqiInfo.text;
        document.getElementById('hist-aqi-status').style.color = aqiInfo.color;

        const pct = Math.min(100, (aqiVal / 300) * 100);
        const bar = document.getElementById('hist-aqi-progress');
        if (bar) { bar.style.width = `${pct}%`; bar.style.backgroundColor = aqiInfo.color; }

        const tipEl = document.getElementById('hist-aqi-tip');
        if (tipEl) {
            if (aqiVal <= 50) tipEl.textContent = 'Good air quality for the day.';
            else if (aqiVal <= 100) tipEl.textContent = 'Air quality was acceptable.';
            else if (aqiVal <= 150) tipEl.textContent = 'Sensitive groups may have been affected.';
            else tipEl.textContent = 'Air quality was unhealthy on this day.';
        }
    } else {
        document.getElementById('hist-aqi-value').textContent = 'Insufficient data';
        document.getElementById('hist-aqi-status').textContent = 'Insufficient data';
        document.getElementById('hist-co-level').textContent = 'CO: Insufficient data';
        const bar = document.getElementById('hist-aqi-progress');
        if (bar) { bar.style.width = '0%'; bar.style.backgroundColor = 'transparent'; }
        const tipEl = document.getElementById('hist-aqi-tip');
        if (tipEl) tipEl.textContent = 'Historical AQI not available.';
    }

    // Humidity
    document.getElementById('hist-humidity').innerHTML = `${day.avghumidity}<small>%</small>`;
    const histDropFill = document.getElementById('hist-humidity-drop');
    if (histDropFill) histDropFill.style.setProperty('--fill', `${day.avghumidity}%`);

    // Visibility
    document.getElementById('hist-visibility').innerHTML = `${day.avgvis_km} <small>km</small>`;

    // Pressure – average from hourly
    const pressVals = hours.map(h => h.pressure_mb).filter(v => v != null && v > 0);
    const pressEl = document.getElementById('hist-pressure');
    if (pressEl && pressVals.length > 0) {
        const avgPress = Math.round(pressVals.reduce((a, b) => a + b, 0) / pressVals.length);
        pressEl.innerHTML = `${avgPress} <small style="font-size: 0.9rem">hPa</small>`;
        const trendEl = document.getElementById('hist-pressure-trend');
        if (trendEl) {
            if (avgPress > 1020) trendEl.textContent = 'High / Stable';
            else if (avgPress < 1000) trendEl.textContent = 'Low / Stormy';
            else trendEl.textContent = 'Normal';
        }
    } else if (pressEl) {
        pressEl.innerHTML = `Insufficient data`;
        document.getElementById('hist-pressure-trend').textContent = 'Insufficient data';
    }

    // Sun Times
    document.getElementById('hist-sunrise-time').textContent = astro.sunrise;
    document.getElementById('hist-sunset-time').textContent = astro.sunset;

    // Rainfall
    document.getElementById('hist-rainfall').innerHTML = `${day.totalprecip_mm} <small>mm</small>`;

    // UV Index + label
    const uvEl = document.getElementById('hist-uv-index');
    const uvLabelEl = document.getElementById('hist-uv-label');
    if (uvEl) uvEl.textContent = day.uv;
    if (uvLabelEl) {
        const uv = day.uv;
        if (uv <= 2) uvLabelEl.textContent = 'Low';
        else if (uv <= 5) uvLabelEl.textContent = 'Moderate';
        else if (uv <= 7) uvLabelEl.textContent = 'High';
        else if (uv <= 10) uvLabelEl.textContent = 'Very High';
        else uvLabelEl.textContent = 'Extreme';
    }
}

async function loadPastDailyForecast(cityName) {
    const listEl = document.getElementById('daily-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="daily-item"><p>Loading historical data...</p></div>';

    const dates = [];
    for (let i = 1; i <= 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
    }

    try {
        const promises = dates.map(dt => fetchWithRetry(`/api/history?q=${encodeURIComponent(cityName)}&dt=${dt}`));
        const settled = await Promise.allSettled(promises);
        const results = settled.filter(res => res.status === 'fulfilled').map(res => res.value);

        listEl.innerHTML = ''; // Clear loading
        results.forEach(data => {
            if (data.forecast && data.forecast.forecastday && data.forecast.forecastday[0]) {
                const day = data.forecast.forecastday[0];
                const item = createForecastItem(day);
                listEl.appendChild(item);
            }
        });

        if (results.length === 0) listEl.innerHTML = '<div class="daily-item"><p>No history available.</p></div>';

    } catch (err) {
        console.error("Past Daily Error:", err);
        listEl.innerHTML = '<div class="daily-item"><p>Error loading history.</p></div>';
    }
}

async function updateUI(data, fused = null) {
    const current = data.current;
    const location = data.location;
    const forecast = data.forecast.forecastday;

    // Cache current city data
    currentCityData = {
        name: location.name,
        lat: location.lat,
        lon: location.lon
    };

    // Start city-local clock (uses IANA tz from WeatherAPI location.tz_id)
    const tzId = location.tz_id;
    if (tzId) startCityClock(tzId, location.name);

    // Update Map if initialized
    if (isMapInitialized) {
        updateMap(location.lat, location.lon);
    }

    // 1. Header & Current
    document.getElementById('city-name').textContent = location.name;
    const tempC = Math.round(current.temp_c);
    const tempF = Math.round(current.temp_f);
    document.getElementById('temperature').textContent = `${tempC}°C / ${tempF}°F`;
    
    // Use smart condition from fusion engine if available, else fall back to API text
    const smartCondition = fused?.condition ?? current.condition.text;
    document.getElementById('condition').textContent = smartCondition;
    
    // Confidence badge
    const badge = document.getElementById('confidence-badge');
    if (badge && fused) {
        badge.innerHTML = `
            <span style="color:${fused.confidence_color}">${fused.confidence_icon} ${fused.confidence_label}</span>
            &nbsp;·&nbsp; <span>Sources: ${fused.sources_count}</span>
            &nbsp;·&nbsp; <span>Updated: ${fused.last_updated}</span>`;
        badge.style.display = 'flex';
    }
    
    // Feels like
    const feelsEl = document.getElementById('feels-like');
    if (feelsEl) {
        const fl = fused?.feels_like ?? current.feelslike_c;
        feelsEl.textContent = `Feels like ${Math.round(fl)}°C`;
    }
    
    // Use native timezone hour for daylight checks and theme
    let localHour = 12; // default
    try {
        if (location.tz_id) {
            localHour = parseInt(new Date().toLocaleString('en-US', {
                timeZone: location.tz_id,
                hour: 'numeric',
                hour12: false
            }), 10);
        }
    } catch (e) { console.warn("Locale parsing error:", e); }

    const isDay = (localHour >= 6 && localHour < 18);
    
    // Update target greeting based on new timezone hour!
    let greet = 'Good Night';
    if (localHour >= 5 && localHour < 12) greet = 'Good Morning';
    else if (localHour >= 12 && localHour < 17) greet = 'Good Afternoon';
    else if (localHour >= 17 && localHour < 21) greet = 'Good Evening';

    const greetEl = document.getElementById('greeting');
    if (greetEl) greetEl.textContent = greet;

    // Background dynamic logic
    const conditionText = current.condition.text.toLowerCase();
    const windKph = current.wind_kph;
    
    // Theme Injection
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(isDay ? 'theme-light' : 'theme-dark');
    
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = isDay ? 'ri-sun-fill theme-icon' : 'ri-moon-fill theme-icon';
        themeIcon.style.color = isDay ? '#FFD700' : '#A0A0B0'; // Yellow sun, silver moon
    }
    
    // Evaluate folder path based on time
    const folder = isDay ? 'assets/day/' : 'assets/night/';
    let bgImage = `${folder}cloudy.jpeg`; // base fallback
    
    if (tempC > 35) {
        bgImage = `${folder}heatwave.jpeg`;
    } else if (tempC < 5 && !(conditionText.includes('snow') || conditionText.includes('blizzard') || conditionText.includes('ice'))) {
        bgImage = `${folder}coldwave.png`;
    } else if (windKph > 35) { // Extremely windy
        // If it's night and windy, I only have assets/night/windy.png
        // If it's day and windy, I have assets/day/windy.jpeg
        bgImage = isDay ? 'assets/day/windy.jpeg' : 'assets/night/windy.png';
    } else if (conditionText.includes('snow') || conditionText.includes('blizzard') || conditionText.includes('ice') || conditionText.includes('sleet')) {
        bgImage = `${folder}snowy.jpeg`;
    } else if (conditionText.includes('thunder') || conditionText.includes('storm') || conditionText.includes('torrential')) {
        bgImage = `${folder}stormy.jpeg`;
    } else if (conditionText.includes('rain') || conditionText.includes('drizzle')) {
        bgImage = `${folder}rainy.jpeg`;
    } else if (conditionText.includes('mist') || conditionText.includes('fog')) {
        if (current.vis_km > 7) {
            bgImage = isDay ? 'assets/day/Sunny.jpeg' : 'assets/night/clear.jpeg';
        } else {
            bgImage = `${folder}foggy.jpeg`;
        }
    } else if (conditionText.includes('cloud') || conditionText.includes('overcast')) {
        // assets/day/Cloudy.jpeg exists with capital C, assets/night/cloudy.jpeg exists with lowercase c
        bgImage = isDay ? 'assets/day/Cloudy.jpeg' : 'assets/night/cloudy.jpeg';
    } else if (conditionText.includes('sun') || conditionText.includes('clear')) {
        bgImage = isDay ? 'assets/day/Sunny.jpeg' : 'assets/night/clear.jpeg';
    } else {
        bgImage = isDay ? 'assets/day/Sunny.jpeg' : 'assets/night/clear.jpeg';
    }
    
    document.body.style.backgroundImage = `url('${bgImage}')`;

    // UV Index + label
    const uvVal = current.uv;
    document.getElementById('uv-index').textContent = uvVal;
    const uvLabelEl = document.getElementById('uv-label');
    if (uvLabelEl) {
        if (uvVal <= 2) uvLabelEl.textContent = 'Low';
        else if (uvVal <= 5) uvLabelEl.textContent = 'Moderate';
        else if (uvVal <= 7) uvLabelEl.textContent = 'High';
        else if (uvVal <= 10) uvLabelEl.textContent = 'Very High';
        else uvLabelEl.textContent = 'Extreme';
    }
    
    // Wind Rotation
    const rose = document.getElementById('wind-rose');
    if (rose) rose.style.setProperty('--rotation', `${current.wind_degree}deg`);
    
    // Use innerHTML to keep styling for units
    document.getElementById('wind-status').innerHTML = `${current.wind_kph} <small>km/h</small>`;
    document.getElementById('wind-dir').textContent = `Direction: ${current.wind_dir} (${current.wind_degree}°)`;
    document.getElementById('humidity').innerHTML = `${current.humidity}<small>%</small>`;
    
    // Humidity water drop dynamic fill
    const dropFill = document.getElementById('humidity-drop');
    if (dropFill) dropFill.style.setProperty('--fill', `${current.humidity}%`);
    
    document.getElementById('visibility').innerHTML = `${fused?.visibility ?? current.vis_km} <small>km</small>`;
    
    // Atmospheric Pressure
    const pressEl = document.getElementById('pressure');
    if (pressEl) {
        const pMb = fused?.pressure_mb ?? current.pressure_mb;
        pressEl.innerHTML = `${Math.round(pMb)} <small style="font-size: 0.9rem">hPa</small>`;
        
        const trendEl = document.getElementById('pressure-trend');
        if (trendEl) {
            if (pMb > 1020) trendEl.textContent = "High / Stable";
            else if (pMb < 1000) trendEl.textContent = "Low / Stormy";
            else trendEl.textContent = "Normal";
        }
    }    
    // Sun data from today's forecast
    const todayAstro = forecast[0].astro;
    document.getElementById('sunrise-time').textContent = todayAstro.sunrise;
    document.getElementById('sunset-time').textContent = todayAstro.sunset;
    
    // Rainfall (using precip_mm)
    document.getElementById('rainfall').innerHTML = `${current.precip_mm} <small>mm</small>`;
    
    // AQI Logic
    let aqiVal = 0;
    let coVal = 0;
    
    if (current.air_quality) {
        const epaIndex = current.air_quality['us-epa-index'];
        coVal = Math.round(current.air_quality.co);
        
        const map = {1: 30, 2: 70, 3: 130, 4: 180, 5: 250, 6: 350};
        aqiVal = map[epaIndex] || 50; 
    }
    
    document.getElementById('aqi-value').textContent = aqiVal;
    document.getElementById('co-level').textContent = `CO: ${coVal} µg/m³`;
    
    const aqiInfo = getAqiStatus(aqiVal);
    document.getElementById('aqi-status').textContent = aqiInfo.text;
    document.getElementById('aqi-status').style.color = aqiInfo.color;
    
    const percent = Math.min(100, (aqiVal / 300) * 100);
    const bar = document.getElementById('aqi-progress');
    bar.style.width = `${percent}%`;
    bar.style.backgroundColor = aqiInfo.color;
    
    // Update AQI Tip
    const tipEl = document.getElementById('aqi-tip');
    if (tipEl) {
        if (aqiVal <= 50) tipEl.textContent = "Tip: Perfect day for outdoor activities!";
        else if (aqiVal <= 100) tipEl.textContent = "Tip: Air quality is acceptable, enjoy your day.";
        else if (aqiVal <= 150) tipEl.textContent = "Tip: Sensitive groups should limit prolonged outdoor exertion.";
        else tipEl.textContent = "Tip: Wear a mask and stay indoors to protect your health.";
    }

    // 3. Hourly Chart
    rawForecastData = forecast;
    renderHourlyChart();

    // 4. Daily Forecast (Full 14 days if available)
    fullForecastData = forecast.map(day => {
        const date = new Date(day.date);
        return {
            dateObj: date,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dateStr: date.toLocaleDateString('en-US', { disableYear: true }),
            high: Math.round(day.day.maxtemp_c),
            low: Math.round(day.day.mintemp_c),
            highF: Math.round(day.day.maxtemp_f),
            lowF: Math.round(day.day.mintemp_f),
            condition: day.day.condition.text,
            isToday: date.getDate() === new Date().getDate(),
            rawDay: day // keep raw if needed
        };
    });
    
    // Fallback logic for full 14 day prediction via Open-Meteo since free Weather API limits forecast to 3 days
    if (fullForecastData.length < 14 && currentCityData) {
        try {
            const omRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentCityData.lat}&longitude=${currentCityData.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=14`);
            if (omRes.ok) {
                const omData = await omRes.json();
                if (omData && omData.daily && omData.daily.time) {
                    fullForecastData = omData.daily.time.map((dateStr, i) => {
                        const date = new Date(dateStr);
                        // Make date object local noon to avoid timezone shift dropping a day
                        date.setHours(12, 0, 0, 0); 
                        const code = omData.daily.weathercode[i];
                        let condition = "Clear";
                        if (code >= 1 && code <= 3) condition = "Cloudy";
                        else if (code >= 45 && code <= 48) condition = "Fog";
                        else if (code >= 51 && code <= 67) condition = "Rain";
                        else if (code >= 71 && code <= 77) condition = "Snow";
                        else if (code >= 95) condition = "Thunderstorm";

                        return {
                            dateObj: date,
                            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                            dateStr: date.toLocaleDateString('en-US', { disableYear: true }),
                            high: Math.round(omData.daily.temperature_2m_max[i]),
                            low: Math.round(omData.daily.temperature_2m_min[i]),
                            highF: Math.round(omData.daily.temperature_2m_max[i] * 9/5 + 32),
                            lowF: Math.round(omData.daily.temperature_2m_min[i] * 9/5 + 32),
                            condition: condition,
                            isToday: i === 0,
                            rawDay: {
                                date: dateStr,
                                day: {
                                    maxtemp_c: Math.round(omData.daily.temperature_2m_max[i]),
                                    mintemp_c: Math.round(omData.daily.temperature_2m_min[i]),
                                    maxtemp_f: Math.round(omData.daily.temperature_2m_max[i] * 9/5 + 32),
                                    mintemp_f: Math.round(omData.daily.temperature_2m_min[i] * 9/5 + 32),
                                    condition: { text: condition }
                                }
                            }
                        };
                    });
                }
            }
        } catch(e) { console.error("Open-Meteo Fallback Error", e); }
    }
    
    if (currentDailyType === 'future') {
        renderForecast();
    }

    // ── Render Intelligence Panel ───────────────────────────────────────────
    if (fused) renderIntelligencePanel(fused);
}


// ─── Intelligence Panel Renderer ─────────────────────────────────────────────
function renderIntelligencePanel(fused) {
    // Guard — if this is called without intelligence data, hide panel
    if (!fused) return;

    const panel = document.getElementById('intelligence-panel');
    if (panel) panel.style.display = 'block';

    // ── 🔮 Next Hour Prediction ─────────────────────────────────────────────
    const predTemp = document.getElementById('intel-pred-temp');
    const predCond = document.getElementById('intel-pred-condition');
    const tempDir  = document.getElementById('intel-temp-direction');
    const confBadge= document.getElementById('intel-confidence');

    if (predTemp) predTemp.textContent = fused.predicted_temp != null ? `${fused.predicted_temp}°C` : '...' ;
    if (predCond) predCond.textContent  = fused.predicted_condition ?? '...' ;
    if (confBadge) confBadge.textContent = fused.prediction_confidence ?? '...' ;

    if (tempDir) {
        const dir = fused.temp_direction ?? '';
        tempDir.textContent = dir;
        // Apply colour class
        tempDir.className = 'intel-trend-arrow';
        if (dir.includes('↑'))      tempDir.classList.add('rising');
        else if (dir.includes('↓')) tempDir.classList.add('falling');
        else                         tempDir.classList.add('stable');
    }

    // ── 🌧️ Rain Probability ────────────────────────────────────────────────
    const rainBadge   = document.getElementById('intel-rain-badge');
    const rainFactors = document.getElementById('intel-rain-factors');
    const rain = fused.rain_probability ?? 'Low';

    if (rainBadge) {
        rainBadge.textContent = rain;
        rainBadge.className = 'intel-rain-badge ' + rain.toLowerCase();
    }

    if (rainFactors) {
        const factors = fused.rain_factors ?? [];
        rainFactors.innerHTML = factors.slice(0, 3).map(f =>
            `<div class="rain-factor-item">${f}</div>`
        ).join('');
    }

    // ── 📊 Stability ───────────────────────────────────────────────────────
    const stabilityBadge  = document.getElementById('intel-stability-badge');
    const stabilityDetail = document.getElementById('intel-stability-detail');
    const stability = fused.stability ?? 'Stable';

    if (stabilityBadge) {
        stabilityBadge.textContent = stability;
        stabilityBadge.className = 'intel-stability-badge ' + stability.toLowerCase();
    }
    if (stabilityDetail) {
        const varText = fused.temp_variance != null
            ? `Temp variance: ±${fused.temp_variance.toFixed(1)}°C`
            : 'Monitoring environmental patterns';
        stabilityDetail.textContent = varText;
    }

    // ── ⚠️ Anomaly Banner ─────────────────────────────────────────────────
    const anomalyBanner = document.getElementById('anomaly-banner');
    const anomalyText   = document.getElementById('anomaly-banner-text');
    const anomalies     = fused.anomalies ?? [];
    const severity      = fused.anomaly_severity ?? 'none';

    if (anomalyBanner) {
        if (anomalies.length > 0) {
            anomalyBanner.style.display = 'flex';
            anomalyBanner.className = 'anomaly-banner' + (severity === 'critical' ? ' critical' : '');
            if (anomalyText) anomalyText.textContent = anomalies[0]; // Show most important first
        } else {
            anomalyBanner.style.display = 'none';
        }
    }

    // ── 💡 Smart Insights ─────────────────────────────────────────────────
    const insightList = document.getElementById('intel-insight-list');
    const insights    = fused.insights ?? [];

    if (insightList) {
        if (insights.length === 0) {
            insightList.innerHTML = '<li class="insight-item insight-loading">📡 Gathering environmental data…</li>';
        } else {
            insightList.innerHTML = insights.map((ins, i) =>
                `<li class="insight-item" style="animation-delay:${i*0.07}s">${ins}</li>`
            ).join('');
        }
    }
}

// -- Saved Cities Logic --
function renderSavedList() {
    const container = document.getElementById('saved-view');
    const cities = getSavedCities();

    if (cities.length === 0) {
        container.innerHTML = `
            <div class="card placeholder-card">
                <i class="ri-heart-line"></i>
                <h2>No Saved Locations</h2>
                <p>Search a city and double-click its name to save it here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `<div class="dashboard-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));"></div>`;
    const grid = container.querySelector('.dashboard-grid');

    cities.forEach(city => {
        const card = document.createElement('div');
        card.className = 'card highlight-card';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s';
        
        card.innerHTML = `
            <h3>${city.name}</h3>
            <div class="value"><i class="ri-map-pin-line"></i></div>
            <div class="sub-value">Click to load</div>
            <button class="saved-delete-btn"><i class="ri-delete-bin-line"></i> Remove</button>
        `;

        // Click to load
        card.addEventListener('click', (e) => {
             // If clicked delete button
             if (e.target.closest('button')) {
                 e.stopPropagation();
                 removeCity(city.name);
                 renderSavedList();
                 return;
             }
             
             loadCity(city.name);
             
             // Switch to dashboard
             document.querySelector('[data-target="dashboard"]').click();
        });
        
        // Hover effect
        card.onmouseenter = () => card.style.transform = 'translateY(-5px)';
        card.onmouseleave = () => card.style.transform = 'translateY(0)';

        grid.appendChild(card);
    });

}

function getAqiStatus(val) {
    if (val <= 50) return { text: 'Good', color: '#4ade80' }; 
    if (val <= 100) return { text: 'Moderate', color: '#facc15' }; 
    if (val <= 150) return { text: 'Unhealthy (Sens.)', color: '#fb923c' }; 
    if (val <= 200) return { text: 'Unhealthy', color: '#f87171' }; 
    if (val <= 300) return { text: 'Very Unhealthy', color: '#b91c1c' }; 
    return { text: 'Hazardous', color: '#7f1d1d' }; 
}

function renderForecast() {
    dailyListEl.innerHTML = '';
    
    fullForecastData.forEach(day => {
        // Create generic object structure matching what createForecastItem needs
        // But since we have full logic there, let's reuse a helper function or write inline if simple.
        // Actually, let's extract a helper since History uses it too.
        
        // Construct a 'pseudo' day object compatible with our helper
        const item = createForecastItem(day.rawDay);
        dailyListEl.appendChild(item);
    });
}

// Helper to create a forecast row
function createForecastItem(dayData) {
    const item = document.createElement('div');
    item.classList.add('daily-item');
    
    const date = new Date(dayData.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = `${date.getDate()}/${date.getMonth()+1}`;
    
    const condition = dayData.day.condition.text;
    const highC = Math.round(dayData.day.maxtemp_c);
    const lowC = Math.round(dayData.day.mintemp_c);
    const highF = Math.round(dayData.day.maxtemp_f);
    const lowF = Math.round(dayData.day.mintemp_f);

    // Icon mapping
    let iconClass = 'ri-sun-line';
    const c = condition.toLowerCase();
    if (c.includes('cloud') || c.includes('overcast')) iconClass = 'ri-cloud-line';
    if (c.includes('rain') || c.includes('drizzle')) iconClass = 'ri-rainy-line';
    if (c.includes('storm') || c.includes('thunder')) iconClass = 'ri-thunderstorms-line';
    if (c.includes('snow') || c.includes('ice')) iconClass = 'ri-snowy-line';
    if (c.includes('mist') || c.includes('fog')) iconClass = 'ri-foggy-line';
    if (c.includes('sun') || c.includes('clear')) iconClass = 'ri-sun-fill';

    item.innerHTML = `
        <span>${dayName} <small>${dateStr}</small></span>
        <div class="condition-icon">
            <i class="${iconClass}"></i>
            <span>${condition}</span>
        </div>
        <div style="text-align: right;">
            <div><span style="font-weight: bold;">${highC}°C</span> / <span style="font-weight: bold;">${highF}°F</span></div>
            <div style="font-size: 0.9em; opacity: 0.8;">${lowC}°C / ${lowF}°F</div>
        </div>
    `;
    return item;
}

function renderHourlyChart() {
    if (!rawForecastData) return;
    
    const nowHour = new Date().getHours();
    let allPoints = [];
    
    // Collect all hours for today and next days
    const todayHours = rawForecastData[0].hour;
    const tomorrowHours = rawForecastData[1] ? rawForecastData[1].hour : [];
    const nextDayHours = rawForecastData[2] ? rawForecastData[2].hour : [];
    
    const combinedHours = [...todayHours, ...tomorrowHours, ...nextDayHours];
    
    // Filter hours starting from now
    combinedHours.forEach(h => {
        const hDate = new Date(h.time);
        if (hDate.getTime() >= new Date().setMinutes(0,0,0) - 3600000) { 
             allPoints.push(h);
        }
    });
    
    let startIndex = 0;
    while(startIndex < allPoints.length && new Date(allPoints[startIndex].time).getTime() < new Date().setMinutes(0,0,0)) {
        startIndex++;
    }
    
    const hourlyPoints = [];
    for (let i = startIndex; i < startIndex + currentForecastDuration && i < allPoints.length; i++) {
        const h = allPoints[i];
        
        let val = 0;
        if (currentForecastMetric === 'temperature') val = h.temp_c;
        else if (currentForecastMetric === 'precipitation') val = h.precip_mm;
        else if (currentForecastMetric === 'wind') val = h.wind_kph;
        
        hourlyPoints.push({
            time: (i === startIndex) ? "Now" : new Date(h.time).toLocaleTimeString('en-US', {hour: 'numeric', hour12: true}),
            value: val
        });
    }
    
    updateChart(hourlyPoints, currentForecastMetric);
}

function updateChart(dataPoints, metric = 'temperature') {
    const labels = dataPoints.map(d => d.time);
    const values = dataPoints.map(d => d.value);
    
    let borderColor = '#4facfe';
    let backgroundColor = 'rgba(79, 172, 254, 0.2)';
    let chartType = 'line';
    let valFormatter = (value) => value + '°C';
    let pointRadius = 4;
    
    if (metric === 'precipitation') {
        borderColor = '#00cdac';
        backgroundColor = 'rgba(0, 205, 172, 0.5)';
        chartType = 'bar';
        valFormatter = (value) => value > 0 ? value + 'mm' : '0';
        pointRadius = 0;
    } else if (metric === 'wind') {
        borderColor = '#a18cd1';
        backgroundColor = 'rgba(161, 140, 209, 0.2)';
        valFormatter = (value) => value + 'km/h';
    }
    
    if (weatherChart) {
        weatherChart.destroy();
    }
    
    weatherChart = new Chart(hourlyCtx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: metric.charAt(0).toUpperCase() + metric.slice(1),
                data: values,
                borderColor: borderColor, 
                backgroundColor: backgroundColor, 
                borderWidth: 3,
                tension: 0.4, 
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: borderColor,
                pointRadius: pointRadius,
                pointHoverRadius: pointRadius + 2,
                borderRadius: metric === 'precipitation' ? 4 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            layout: {
                padding: { top: 30, left: 10, right: 20 }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                datalabels: {
                    align: 'top',
                    color: '#ffffff',
                    font: {
                        family: "'Outfit', sans-serif",
                        weight: 'bold',
                        size: 12
                    },
                    formatter: valFormatter
                }
            },
            layout: {
                padding: {
                    left: 15,
                    right: 25,
                    top: 20,
                    bottom: 10
                }
            },
            scales: {
                x: {
                    grid: { display: true, color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { 
                        color: 'rgba(255,255,255,0.8)', 
                        font: { family: "'Outfit', sans-serif", size: 11 } 
                    }
                },
                y: {
                    display: false, 
                    min: metric === 'precipitation' ? 0 : Math.min(...values) - 5, 
                    suggestedMax: Math.max(...values) + (metric === 'temperature' ? 5 : (metric === 'precipitation' ? 2 : 10))
                }
            }
        }
    });
}

// Run
init();
