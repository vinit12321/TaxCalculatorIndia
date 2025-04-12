// Format currency in Indian Rupee format
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
        maximumFractionDigits: 0
    });
}

// Format percentage
function formatPercentage(value) {
    return parseFloat(value).toFixed(2) + '%';
}

// Update Old Regime Tax Slabs based on age category
function updateOldRegimeSlabs(ageCategory) {
    const oldRegimeSlabsBody = document.getElementById('oldRegimeSlabsBody');
    oldRegimeSlabsBody.innerHTML = '';
    
    if (ageCategory === 'below_60') {
        // Below 60 years
        oldRegimeSlabsBody.innerHTML = `
            <tr><td>Up to ₹2,50,000</td><td>0%</td></tr>
            <tr><td>₹2,50,001 - ₹5,00,000</td><td>5%</td></tr>
            <tr><td>₹5,00,001 - ₹10,00,000</td><td>20%</td></tr>
            <tr><td>Above ₹10,00,000</td><td>30%</td></tr>
        `;
    } else if (ageCategory === '60_to_80') {
        // 60 to 80 years
        oldRegimeSlabsBody.innerHTML = `
            <tr><td>Up to ₹3,00,000</td><td>0%</td></tr>
            <tr><td>₹3,00,001 - ₹5,00,000</td><td>5%</td></tr>
            <tr><td>₹5,00,001 - ₹10,00,000</td><td>20%</td></tr>
            <tr><td>Above ₹10,00,000</td><td>30%</td></tr>
        `;
    } else if (ageCategory === 'above_80') {
        // Above 80 years
        oldRegimeSlabsBody.innerHTML = `
            <tr><td>Up to ₹5,00,000</td><td>0%</td></tr>
            <tr><td>₹5,00,001 - ₹10,00,000</td><td>20%</td></tr>
            <tr><td>Above ₹10,00,000</td><td>30%</td></tr>
        `;
    }
}

// Display calculation results
function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    
    if (data.status === 'error') {
        // Show error message
        alert('Error: ' + data.message);
        return;
    }
    
    // Show results section
    resultsSection.classList.remove('d-none');
    
    // Update recommendation
    const recommendationText = document.getElementById('recommendationText');
    const taxSavingsText = document.getElementById('taxSavingsText');
    
    if (data.recommended_regime === 'new') {
        recommendationText.innerHTML = `Based on your inputs, the <strong>New Tax Regime</strong> is recommended for you. You could save <strong>${formatCurrency(data.tax_savings)}</strong> in taxes.`;
        document.getElementById('taxRecommendation').className = 'alert alert-success mb-4';
    } else {
        recommendationText.innerHTML = `Based on your inputs, the <strong>Old Tax Regime</strong> is recommended for you. You could save <strong>${formatCurrency(data.tax_savings)}</strong> in taxes.`;
        document.getElementById('taxRecommendation').className = 'alert alert-info mb-4';
    }
    
    taxSavingsText.innerHTML = `By choosing the ${data.recommended_regime === 'new' ? 'New' : 'Old'} Tax Regime, you could save <strong>${formatCurrency(data.tax_savings)}</strong> in taxes.`;
    
    // Update summary comparison
    document.getElementById('oldGrossIncome').innerText = formatCurrency(data.old_regime.gross_income);
    document.getElementById('newGrossIncome').innerText = formatCurrency(data.new_regime.gross_income);
    
    document.getElementById('oldStandardDeduction').innerText = formatCurrency(data.old_regime.standard_deduction);
    document.getElementById('newStandardDeduction').innerText = formatCurrency(data.new_regime.standard_deduction);
    
    document.getElementById('oldOtherDeductions').innerText = formatCurrency(data.old_regime.other_deductions);
    
    document.getElementById('oldTaxableIncome').innerText = formatCurrency(data.old_regime.taxable_income);
    document.getElementById('newTaxableIncome').innerText = formatCurrency(data.new_regime.taxable_income);
    
    document.getElementById('oldTaxBeforeCess').innerText = formatCurrency(data.old_regime.tax_before_cess);
    document.getElementById('newTaxBeforeCess').innerText = formatCurrency(data.new_regime.tax_before_cess);
    
    document.getElementById('oldCess').innerText = formatCurrency(data.old_regime.cess);
    document.getElementById('newCess').innerText = formatCurrency(data.new_regime.cess);
    
    document.getElementById('oldTaxLiability').innerText = formatCurrency(data.old_regime.tax_liability);
    document.getElementById('newTaxLiability').innerText = formatCurrency(data.new_regime.tax_liability);
    
    // Update old regime detailed tab
    document.getElementById('oldDetailGrossIncome').innerText = formatCurrency(data.old_regime.gross_income);
    document.getElementById('oldDetailStandardDeduction').innerText = formatCurrency(data.old_regime.standard_deduction);
    document.getElementById('oldDetailOtherDeductions').innerText = formatCurrency(data.old_regime.other_deductions);
    document.getElementById('oldDetailTaxableIncome').innerText = formatCurrency(data.old_regime.taxable_income);
    
    document.getElementById('oldDetailBaseTax').innerText = formatCurrency(data.old_regime.breakdown.base_tax);
    document.getElementById('oldDetailSurcharge').innerText = formatCurrency(data.old_regime.breakdown.surcharge);
    document.getElementById('oldDetailCess').innerText = formatCurrency(data.old_regime.breakdown.cess);
    document.getElementById('oldDetailTaxLiability').innerText = formatCurrency(data.old_regime.tax_liability);
    
    // Update new regime detailed tab
    document.getElementById('newDetailGrossIncome').innerText = formatCurrency(data.new_regime.gross_income);
    document.getElementById('newDetailStandardDeduction').innerText = formatCurrency(data.new_regime.standard_deduction);
    document.getElementById('newDetailTaxableIncome').innerText = formatCurrency(data.new_regime.taxable_income);
    
    document.getElementById('newDetailBaseTax').innerText = formatCurrency(data.new_regime.breakdown.base_tax);
    document.getElementById('newDetailSurcharge').innerText = formatCurrency(data.new_regime.breakdown.surcharge);
    document.getElementById('newDetailCess').innerText = formatCurrency(data.new_regime.breakdown.cess);
    document.getElementById('newDetailTaxLiability').innerText = formatCurrency(data.new_regime.tax_liability);
    
    // Update tax slabs based on age category
    updateOldRegimeSlabs(document.getElementById('age_category').value);
    
    // Create chart
    createTaxComparisonChart(data.old_regime.tax_liability, data.new_regime.tax_liability);
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    const taxCalculatorForm = document.getElementById('taxCalculatorForm');
    const resetForm = document.getElementById('resetForm');
    const ageCategory = document.getElementById('age_category');
    
    // Initialize old regime slabs
    updateOldRegimeSlabs('below_60');
    
    // Update old regime slabs when age category changes
    ageCategory.addEventListener('change', function() {
        updateOldRegimeSlabs(this.value);
    });
    
    // Reset form
    resetForm.addEventListener('click', function() {
        taxCalculatorForm.reset();
        document.getElementById('resultsSection').classList.add('d-none');
        updateOldRegimeSlabs('below_60');
    });
    
    // Form submission
    taxCalculatorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!taxCalculatorForm.checkValidity()) {
            e.stopPropagation();
            taxCalculatorForm.classList.add('was-validated');
            return;
        }
        
        // Create FormData and submit
        const formData = new FormData(taxCalculatorForm);
        
        // Send AJAX request
        fetch('/calculate', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while calculating tax: ' + error.message);
        });
    });
});
