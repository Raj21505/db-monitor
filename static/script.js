// static/script.js

const socket = io();

// Elements
const currentDbDisplay = document.getElementById('current-db-display');
const statusText = document.getElementById('status-text');
const highestDbValue = document.getElementById('highest-db-value');
const healthScaleFill = document.getElementById('health-scale-fill');
const healthScaleText = document.getElementById('health-scale-text');
const categoryText = document.getElementById('category-text');
const gaugeArc = document.getElementById('gauge-arc');
const canvas = document.getElementById('noiseGraph');
const ctx = canvas.getContext('2d');

// Configuration Constants (Matches Python's accurate dBA scaling)
const MIN_DB_SCALED = 0; 
const MAX_DB_SCALED = 120; 
const DB_RANGE = MAX_DB_SCALED - MIN_DB_SCALED; 

// GRAPH HISTORY STATE
const HISTORY_LENGTH = 600; 
let dbHistory = new Array(HISTORY_LENGTH).fill(MIN_DB_SCALED);

// HELPER FUNCTION TO READ CSS VARIABLES
const getCssVar = (varName) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

// --- GRAPH DRAWING FUNCTION ---
function drawGraph() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw baseline and max line
    ctx.strokeStyle = '#2a4768';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.9); // Low line (near 0 dBA)
    ctx.lineTo(width, height * 0.9);
    ctx.moveTo(0, height * 0.1); // High line (near 120 dBA)
    ctx.lineTo(width, height * 0.1);
    ctx.stroke();

    // Draw Graph Line
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = getCssVar('--accent-blue');
    
    dbHistory.forEach((db, index) => {
        // Normalize dB: Clamp between MIN_DB and MAX_DB
        const clampedDb = Math.max(MIN_DB_SCALED, Math.min(MAX_DB_SCALED, db));
        
        // Map dB to Y position: MIN_DB (0) is at bottom (height), MAX_DB (120) is at top (0)
        const normalizedValue = (clampedDb - MIN_DB_SCALED) / DB_RANGE; // 0 to 1
        const y = height * (1 - normalizedValue);
        const x = (index / (dbHistory.length - 1)) * width;

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Fill area under graph
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = 'rgba(0, 188, 212, 0.1)';
    ctx.fill();
}


// --- SOCKET DATA HANDLER ---
socket.on('db_update', function(data) {
    const dba_integer = data.db; 
    const max_dba = data.max_db; 
    const classification = data.classification; 

    // 1. Update Real-Time dB and Status
    currentDbDisplay.textContent = dba_integer;
    statusText.textContent = `Status: ${classification}`;
    categoryText.textContent = `Category: ${classification}`;
    
    // 2. Update Highest dB Measured
    highestDbValue.textContent = max_dba;

    // 3. Calculate Scale Percentage (0% to 100%)
    const clampedDba = Math.min(MAX_DB_SCALED, Math.max(MIN_DB_SCALED, dba_integer));
    const percentage = ((clampedDba - MIN_DB_SCALED) / DB_RANGE) * 100;
    
    // 4. Update Linear Health Scale
    healthScaleFill.style.width = percentage + '%';
    // healthScaleText.textContent = `${dba_integer} / ${MAX_DB_SCALED} dBA`;

    // 5. Update Circular Gauge Rotation
    gaugeArc.style.transform = `rotate(${percentage * 3.6}deg)`;
    
    // 6. Color Coding based on Classification (Bar and Text)
    let color;
    let dbColor;

    if (classification === 'EXTREME DANGER') {
        color = getCssVar('--accent-red');
        dbColor = getCssVar('--accent-red');
    } else if (classification === 'High Risk (Loud)') {
        color = getCssVar('--accent-yellow');
        dbColor = getCssVar('--accent-yellow');
    } else if (classification === 'Moderate Noise') {
        color = getCssVar('--accent-green');
        dbColor = getCssVar('--accent-green');
    } else {
        color = getCssVar('--accent-blue');
        dbColor = getCssVar('--accent-blue');
    }
    
    healthScaleFill.style.backgroundColor = color;
    currentDbDisplay.style.color = dbColor;
    
    currentDbDisplay.style.textShadow = (classification === 'EXTREME DANGER') ? getCssVar('--glow-red') : getCssVar('--glow-blue');

    // 7. Update Graph Data and Redraw
    dbHistory.push(dba_integer);
    dbHistory.shift(); 
    drawGraph();
});

// Initial draw and redraw on resize
window.addEventListener('resize', drawGraph);
drawGraph();