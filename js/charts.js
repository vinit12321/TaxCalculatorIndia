// Create tax comparison chart
function createTaxComparisonChart(oldRegimeTax, newRegimeTax) {
    // Get the canvas element
    const ctx = document.getElementById('taxComparisonChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.taxChart instanceof Chart) {
        window.taxChart.destroy();
    }
    
    // Format data for the chart
    const labels = ['Old Regime', 'New Regime'];
    const data = [oldRegimeTax, newRegimeTax];
    
    // Determine colors based on which regime has lower tax
    let backgroundColor = [];
    let borderColor = [];
    
    if (oldRegimeTax < newRegimeTax) {
        backgroundColor = ['rgba(40, 167, 69, 0.7)', 'rgba(108, 117, 125, 0.7)']; // Green for old, gray for new
        borderColor = ['rgb(40, 167, 69)', 'rgb(108, 117, 125)'];
    } else if (newRegimeTax < oldRegimeTax) {
        backgroundColor = ['rgba(108, 117, 125, 0.7)', 'rgba(40, 167, 69, 0.7)']; // Gray for old, green for new
        borderColor = ['rgb(108, 117, 125)', 'rgb(40, 167, 69)'];
    } else {
        backgroundColor = ['rgba(13, 110, 253, 0.7)', 'rgba(13, 110, 253, 0.7)']; // Both blue if equal
        borderColor = ['rgb(13, 110, 253)', 'rgb(13, 110, 253)'];
    }
    
    // Create the chart
    window.taxChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tax Liability',
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Tax Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 100000) {
                                return '₹' + (value / 100000).toFixed(1) + ' Lakh';
                            } else if (value >= 1000) {
                                return '₹' + (value / 1000).toFixed(1) + 'K';
                            } else {
                                return '₹' + value;
                            }
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '₹' + context.parsed.y.toLocaleString('en-IN');
                            return label;
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Create pie chart showing the difference
    createTaxSavingsPieChart(oldRegimeTax, newRegimeTax);
}

// Create pie chart showing tax savings
function createTaxSavingsPieChart(oldRegimeTax, newRegimeTax) {
    // Future enhancement - implement a pie chart showing tax savings proportion
}