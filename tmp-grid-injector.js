import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Extract the dashboard-grid
const startStr = '<div class="dashboard-grid">';
const endStr = '<!-- Forecasts Section (Below Grid) -->';

const startIndex = html.indexOf(startStr);
const endIndex = html.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find dashboard-grid limits");
    process.exit(1);
}

let dashboardGridOriginal = html.substring(startIndex, endIndex).trim();

// 2. We don't want the last closing div from the match boundary if we stripped it, 
// wait, dashboardGrid ends at line 185 `</div>`. It's perfectly enclosed.
// 3. Regex replace all id="X" with id="hist-X"
let histGrid = dashboardGridOriginal.replace(/id="([^"]+)"/g, 'id="hist-$1"');

// 4. Wrap with the History picker
const historyContent = `
            <!-- VIEW: HISTORY -->
            <div id="history-view" class="view-section" style="display: none;">
                <!-- Horizontal Day Picker -->
                <div class="history-picker-container" style="margin-bottom: 20px;">
                    <h3>Historical Weather</h3>
                    <div class="history-scroll-track" id="history-picker">
                        <!-- JS injected past 14 days -->
                    </div>
                </div>

                <!-- Replicated History Dashboard Grid -->
                <!-- Note: The grid is initially hidden until a day is picked/loaded -->
                <div id="hist-grid-container" style="display: none;">
                    ${histGrid}
                </div>
                
                <div id="hist-loading" style="text-align: center; color: var(--text-secondary); padding: 40px;">
                    <i class="ri-loader-4-line ri-spin" style="font-size: 2rem;"></i>
                    <p style="margin-top: 10px;">Select a day to view its detailed weather dashboard...</p>
                </div>
            </div>
`;

// 5. Replace existing history-view
const histStartStr = '            <!-- VIEW: HISTORY -->';
const histEndStr = '        </main>';

const histStartIndex = html.indexOf(histStartStr);
const histEndIndex = html.indexOf(histEndStr);

if (histStartIndex === -1 || histEndIndex === -1) {
    console.log("Could not find history-view limits");
    process.exit(1);
}

const finalHtml = html.substring(0, histStartIndex) + historyContent + '\n' + html.substring(histEndIndex);

fs.writeFileSync('index.html', finalHtml);
console.log("Successfully injected History Grid into index.html");
