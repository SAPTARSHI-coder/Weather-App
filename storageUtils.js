export const STORAGE_KEY = 'weather_app_saved_cities';

/**
 * Get saved cities from localStorage
 * @returns {Array<{name: string, lat: number, lon: number}>}
 */
export function getSavedCities() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Save a city to localStorage
 * @param {Object} city - {name, lat, lon}
 * @returns {boolean} - true if saved, false if duplicate
 */
export function saveCity(city) {
    const cities = getSavedCities();
    // Check key normalization (lowercase)
    const exists = cities.some(c => c.name.toLowerCase() === city.name.toLowerCase());
    
    if (!exists) {
        cities.push(city);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
        return true;
    }
    return false;
}

/**
 * Remove a city
 * @param {string} cityName 
 */
export function removeCity(cityName) {
    let cities = getSavedCities();
    cities = cities.filter(c => c.name.toLowerCase() !== cityName.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}
