import L from 'leaflet';

let mapInstance = null;
let radarLayer = null;
let animationTimer = null;
let timestamps = []; // Holds available times from RainViewer
let currentFrameIndex = 0;
let isPlaying = true;
const OWM_API_KEY = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_OWM_API_KEY : '';
let currentLayerType = 'precip'; // 'precip' or 'clouds'
let cloudsLayer = null;

// DOM
let playBtn, timeSlider, timeDisplay, btnPrecip, btnClouds, playbackControls, radarLegend;

/**
 * Initialize Leaflet Map
 * @param {HTMLElement} containerElement 
 * @param {number} lat 
 * @param {number} lon 
 */
export function initMap(containerElement, lat, lon) {
    if (mapInstance) {
        mapInstance.remove(); // Cleanup previous instance if any
    }

    mapInstance = L.map(containerElement, {
        center: [lat, lon],
        zoom: 8,
        zoomControl: false // Custom or cleaner UI
    });

    // Add OpenStreetMap Base Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
    }).addTo(mapInstance);

    // Reposition zoom control
    L.control.zoom({
        position: 'bottomright'
    }).addTo(mapInstance);

    // Get DOM elements
    playBtn = document.getElementById('map-play-btn');
    timeSlider = document.getElementById('map-slider');
    timeDisplay = document.getElementById('map-time');
    btnPrecip = document.getElementById('btn-layer-precip');
    btnClouds = document.getElementById('btn-layer-clouds');
    playbackControls = document.getElementById('radar-playback');
    radarLegend = document.getElementById('radar-legend');

    if (playBtn) {
        playBtn.onclick = () => {
            if (currentLayerType !== 'precip') return;
            isPlaying = !isPlaying;
            playBtn.innerHTML = isPlaying ? '<i class="ri-pause-fill"></i>' : '<i class="ri-play-fill"></i>';
            if (isPlaying) {
                startAnimationLoop();
            } else {
                clearInterval(animationTimer);
            }
        };
    }

    if (timeSlider) {
        timeSlider.oninput = (e) => {
            if (currentLayerType !== 'precip') return;
            if (isPlaying) {
                isPlaying = false;
                playBtn.innerHTML = '<i class="ri-play-fill"></i>';
                clearInterval(animationTimer);
            }
            currentFrameIndex = parseInt(e.target.value, 10);
            showFrame(currentFrameIndex);
        };
    }

    if (btnPrecip && btnClouds) {
        btnPrecip.onclick = () => switchLayer('precip');
        btnClouds.onclick = () => switchLayer('clouds');
    }

    // Initial Radar Load
    startRadarAnimation();
}

/**
 * Update Map Center
 * @param {number} lat 
 * @param {number} lon 
 */
export function updateMap(lat, lon) {
    if (mapInstance) {
        mapInstance.setView([lat, lon], 8);
    }
}

/**
 * Fix Resize issues (call when tab becomes visible)
 */
export function resizeMap() {
    if (mapInstance) {
        mapInstance.invalidateSize();
    }
}

/**
 * Start RainViewer Overlay Animation
 */
export function startRadarAnimation() {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => res.json())
        .then(data => {
            if (data.radar && data.radar.past) {
                timestamps = data.radar.past; 
                
                if (timestamps.length > 0) {
                    if (timeSlider) {
                        timeSlider.max = timestamps.length - 1;
                        timeSlider.value = 0;
                    }
                    playAnimation();
                }
            }
        })
        .catch(err => console.error("RainViewer API Error:", err));
}

function switchLayer(type) {
    if (type === currentLayerType) return;
    currentLayerType = type;

    if (type === 'clouds') {
        // Activate Cloud UI
        if (btnClouds) btnClouds.classList.add('active');
        if (btnPrecip) btnPrecip.classList.remove('active');
        if (playbackControls) playbackControls.style.display = 'none';
        if (radarLegend) radarLegend.style.display = 'none';
        
        // Stop radar animation
        isPlaying = false;
        clearInterval(animationTimer);
        if (playBtn) playBtn.innerHTML = '<i class="ri-play-fill"></i>';

        // Remove radar layer
        if (radarLayer && mapInstance.hasLayer(radarLayer)) {
            mapInstance.removeLayer(radarLayer);
        }

        // Add clouds layer if not already added
        if (!cloudsLayer) {
            cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`, {
                opacity: 0.8,
                zIndex: 100,
                maxNativeZoom: 18
            });
        }
        if (!mapInstance.hasLayer(cloudsLayer)) {
            cloudsLayer.addTo(mapInstance);
        }

    } else if (type === 'precip') {
        // Activate Precip UI
        if (btnPrecip) btnPrecip.classList.add('active');
        if (btnClouds) btnClouds.classList.remove('active');
        if (playbackControls) playbackControls.style.display = 'flex';
        if (radarLegend) radarLegend.style.display = 'block';

        // Remove clouds layer
        if (cloudsLayer && mapInstance.hasLayer(cloudsLayer)) {
            mapInstance.removeLayer(cloudsLayer);
        }

        // Restart radar animation
        playAnimation();
    }
}

function showFrame(index) {
    if (!mapInstance || timestamps.length === 0 || currentLayerType !== 'precip') return;
    
    // Cache the old layer to prevent flickering during load
    const oldLayer = radarLayer;
    
    const tsObj = timestamps[index];
    const ts = tsObj.time;
    const path = tsObj.path;
    
    radarLayer = L.tileLayer(`https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/4/1_1.png`, {
        opacity: 0.7,
        zIndex: 100,
        maxNativeZoom: 7
    }).addTo(mapInstance);

    // Remove old layer after slight delay
    if (oldLayer) {
        setTimeout(() => {
            if (mapInstance.hasLayer(oldLayer)) {
                mapInstance.removeLayer(oldLayer);
            }
        }, 100);
    }
    
    // Update UI
    if (timeSlider) {
        timeSlider.value = index;
    }
    if (timeDisplay) {
        const d = new Date(ts * 1000);
        timeDisplay.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
}

function startAnimationLoop() {
    if (animationTimer) clearInterval(animationTimer);
    animationTimer = setInterval(() => {
        currentFrameIndex = (currentFrameIndex + 1) % timestamps.length;
        showFrame(currentFrameIndex);
    }, 1000); 
}

function playAnimation() {
    currentFrameIndex = 0;
    showFrame(currentFrameIndex);
    isPlaying = true;
    if (playBtn) playBtn.innerHTML = '<i class="ri-pause-fill"></i>';
    startAnimationLoop();
}
