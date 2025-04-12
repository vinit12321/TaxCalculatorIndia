// Enhanced chart initialization script for GitHub Pages deployment
document.addEventListener('DOMContentLoaded', function() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not found - loading from CDN');
        
        // Add Chart.js from CDN if it's not loaded properly
        const chartScript = document.createElement('script');
        chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
        chartScript.onload = function() {
            console.log('Chart.js loaded successfully from CDN');
        };
        chartScript.onerror = function() {
            console.error('Failed to load Chart.js from CDN');
        };
        document.head.appendChild(chartScript);
    } else {
        console.log('Chart.js already loaded');
    }

    // Add event listener for the calculate button
    const calculateButton = document.getElementById('calculateButton');
    if (calculateButton) {
        calculateButton.addEventListener('click', function() {
            console.log('Calculate button clicked');
            setTimeout(checkForCanvas, 500);
        });
    }

    // Function to check if the canvas was created and is ready
    function checkForCanvas() {
        const canvas = document.getElementById('taxComparisonChart');
        if (canvas) {
            console.log('Canvas found, checking visibility');
            
            // Make sure the results section is visible
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection && resultsSection.classList.contains('d-none')) {
                console.log('Making results section visible');
                resultsSection.classList.remove('d-none');
            }
        } else {
            console.log('Canvas not found yet, will retry');
            setTimeout(checkForCanvas, 500);
        }
    }
});