// Tax Calculator JavaScript for the Static Version

document.addEventListener('DOMContentLoaded', function() {
    // Get references to form and result elements
    const taxCalculatorForm = document.getElementById('taxCalculatorForm');
    const resultsSection = document.getElementById('resultsSection');
    const resetFormButton = document.getElementById('resetForm');
    
    // Set up form submission handler
    taxCalculatorForm.addEventListener('submit', function(event) {
        event.preventDefault();
        calculateTax();
    });
    
    // Set up form reset handler
    resetFormButton.addEventListener('click', function() {
        taxCalculatorForm.reset();
        resultsSection.classList.add('d-none');
    });
    
    // Update old regime tax slabs when age category changes
    document.getElementById('age_category').addEventListener('change', function() {
        updateOldRegimeSlabs(this.value);
    });
    
    // Initialize old regime slabs
    updateOldRegimeSlabs('below_60');
});

// Format currency values (Indian Rupees)
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN', {
        maximumFractionDigits: 0
    });
}

// Format percentage values
function formatPercentage(value) {
    return value.toFixed(2) + '%';
}

// Update old regime tax slabs based on age category
function updateOldRegimeSlabs(ageCategory) {
    const oldRegimeSlabsBody = document.getElementById('oldRegimeSlabsBody');
    oldRegimeSlabsBody.innerHTML = '';
    
    // Different slabs based on age category
    if (ageCategory === 'below_60') {
        oldRegimeSlabsBody.innerHTML = `
            <tr><td>Up to ₹2,50,000</td><td class="text-center">0%</td></tr>
            <tr><td>₹2,50,001 - ₹5,00,000</td><td class="text-center">5%</td></tr>
            <tr><td>₹5,00,001 - ₹10,00,000</td><td class="text-center">20%</td></tr>
            <tr><td>Above ₹10,00,000</td><td class="text-center">30%</td></tr>
        `;
    } else if (ageCategory === '60_to_80') {
        oldRegimeSlabsBody.innerHTML = `
            <tr><td>Up to ₹3,00,000</td><td class="text-center">0%</td></tr>
            <tr><td>₹3,00,001 - ₹5,00,000</td><td class="text-center">5%</td></tr>
            <tr><td>₹5,00,001 - ₹10,00,000</td><td class="text-center">20%</td></tr>
            <tr><td>Above ₹10,00,000</td><td class="text-center">30%</td></tr>
        `;
    } else if (ageCategory === 'above_80') {
        oldRegimeSlabsBody.innerHTML = `
            <tr><td>Up to ₹5,00,000</td><td class="text-center">0%</td></tr>
            <tr><td>₹5,00,001 - ₹10,00,000</td><td class="text-center">20%</td></tr>
            <tr><td>Above ₹10,00,000</td><td class="text-center">30%</td></tr>
        `;
    }
}

// Calculate tax and display results
function calculateTax() {
    // Get form values
    const annualSalary = parseFloat(document.getElementById('annual_salary').value);
    const ageCategory = document.getElementById('age_category').value;
    
    // Get deduction values
    const deductions = {
        section_80c: parseFloat(document.getElementById('section_80c').value) || 0,
        section_80d: parseFloat(document.getElementById('section_80d').value) || 0,
        section_24b: parseFloat(document.getElementById('section_24b').value) || 0,
        section_80e: parseFloat(document.getElementById('section_80e').value) || 0,
        section_80g: parseFloat(document.getElementById('section_80g').value) || 0,
        section_80tta_ttb: parseFloat(document.getElementById('section_80tta_ttb').value) || 0,
        section_80ccd_1b: parseFloat(document.getElementById('section_80ccd_1b').value) || 0,
        section_80ddb: parseFloat(document.getElementById('section_80ddb').value) || 0,
        section_80gg: parseFloat(document.getElementById('section_80gg').value) || 0,
        section_80u: parseFloat(document.getElementById('section_80u').value) || 0
    };
    
    // Calculate deductions total for old regime
    const totalEligibleDeductions = calculateEligibleDeductions(deductions);
    
    // Calculate old regime tax
    const oldRegime = calculateOldRegimeTax(annualSalary, ageCategory, totalEligibleDeductions);
    
    // Calculate new regime tax
    const newRegime = calculateNewRegimeTax(annualSalary);
    
    // Determine which regime is better
    const recommendedRegime = newRegime.taxLiability <= oldRegime.taxLiability ? "new" : "old";
    const taxSavings = Math.abs(oldRegime.taxLiability - newRegime.taxLiability);
    
    // Display results
    displayResults({
        oldRegime,
        newRegime,
        recommendedRegime,
        taxSavings
    });
}

// Calculate eligible deductions for old regime
function calculateEligibleDeductions(deductions) {
    // Section 80C limit of 1.5 lakh
    const section80cLimit = Math.min(deductions.section_80c, 150000);
    
    // Section 80CCD(1B) - NPS limit of 50,000
    const section80ccd1bLimit = Math.min(deductions.section_80ccd_1b, 50000);
    
    // Section 80D - Medical Insurance limit of 1 lakh
    const section80dLimit = Math.min(deductions.section_80d, 100000);
    
    // Other deductions (no specific limits applied here for simplicity)
    const section24bLimit = deductions.section_24b;
    const section80eLimit = deductions.section_80e;
    const section80gLimit = deductions.section_80g;
    const section80ttaTtbLimit = Math.min(deductions.section_80tta_ttb, 50000);
    const section80ddbLimit = Math.min(deductions.section_80ddb, 100000);
    const section80ggLimit = deductions.section_80gg;
    const section80uLimit = Math.min(deductions.section_80u, 125000);
    
    // Calculate total eligible deductions
    return (
        section80cLimit +
        section80ccd1bLimit +
        section80dLimit +
        section24bLimit +
        section80eLimit +
        section80gLimit +
        section80ttaTtbLimit +
        section80ddbLimit +
        section80ggLimit +
        section80uLimit
    );
}

// Calculate tax under old regime
function calculateOldRegimeTax(annualSalary, ageCategory, totalDeductions) {
    // Calculate taxable income
    const taxableIncome = Math.max(0, annualSalary - totalDeductions);
    
    // Initialize tax
    let tax = 0;
    
    // Apply tax slabs based on age category
    if (ageCategory === 'below_60') {
        // For individuals below 60 years
        if (taxableIncome <= 250000) {
            tax = 0;
        } else if (taxableIncome <= 500000) {
            tax = (taxableIncome - 250000) * 0.05;
        } else if (taxableIncome <= 1000000) {
            tax = 12500 + ((taxableIncome - 500000) * 0.2);
        } else {
            tax = 12500 + 100000 + ((taxableIncome - 1000000) * 0.3);
        }
    } else if (ageCategory === '60_to_80') {
        // For senior citizens (60-80 years)
        if (taxableIncome <= 300000) {
            tax = 0;
        } else if (taxableIncome <= 500000) {
            tax = (taxableIncome - 300000) * 0.05;
        } else if (taxableIncome <= 1000000) {
            tax = 10000 + ((taxableIncome - 500000) * 0.2);
        } else {
            tax = 10000 + 100000 + ((taxableIncome - 1000000) * 0.3);
        }
    } else if (ageCategory === 'above_80') {
        // For super senior citizens (above 80 years)
        if (taxableIncome <= 500000) {
            tax = 0;
        } else if (taxableIncome <= 1000000) {
            tax = (taxableIncome - 500000) * 0.2;
        } else {
            tax = 100000 + ((taxableIncome - 1000000) * 0.3);
        }
    }
    
    // Calculate cess (4% of tax)
    const cess = tax * 0.04;
    
    // Calculate total tax liability
    const taxLiability = tax + cess;
    
    return {
        grossIncome: annualSalary,
        standardDeduction: 0,
        otherDeductions: totalDeductions,
        taxableIncome: taxableIncome,
        taxBeforeCess: tax,
        cess: cess,
        taxLiability: taxLiability,
        baseTax: tax,
        surcharge: 0
    };
}

// Calculate tax under new regime
function calculateNewRegimeTax(annualSalary) {
    // New regime doesn't allow deductions
    const standardDeduction = 0;
    const taxableIncome = annualSalary;
    
    // Initialize tax
    let tax = 0;
    
    // Apply new regime tax slabs
    if (taxableIncome <= 300000) {
        tax = 0;
    } else if (taxableIncome <= 600000) {
        tax = (taxableIncome - 300000) * 0.05;
    } else if (taxableIncome <= 900000) {
        tax = 15000 + ((taxableIncome - 600000) * 0.1);
    } else if (taxableIncome <= 1200000) {
        tax = 15000 + 30000 + ((taxableIncome - 900000) * 0.15);
    } else if (taxableIncome <= 1500000) {
        tax = 15000 + 30000 + 45000 + ((taxableIncome - 1200000) * 0.2);
    } else {
        tax = 15000 + 30000 + 45000 + 60000 + ((taxableIncome - 1500000) * 0.3);
    }
    
    // Calculate cess (4% of tax)
    const cess = tax * 0.04;
    
    // Calculate total tax liability
    const taxLiability = tax + cess;
    
    return {
        grossIncome: annualSalary,
        standardDeduction: standardDeduction,
        taxableIncome: taxableIncome,
        taxBeforeCess: tax,
        cess: cess,
        taxLiability: taxLiability,
        baseTax: tax,
        surcharge: 0
    };
}

// Display results in the UI
function displayResults(data) {
    const { oldRegime, newRegime, recommendedRegime, taxSavings } = data;
    
    // Show results section
    document.getElementById('resultsSection').classList.remove('d-none');
    
    // Update recommendation text
    const recommendationText = document.getElementById('recommendationText');
    if (recommendedRegime === 'new') {
        recommendationText.textContent = `The New Tax Regime is better for you, saving you ${formatCurrency(taxSavings)}.`;
    } else {
        recommendationText.textContent = `The Old Tax Regime is better for you, saving you ${formatCurrency(taxSavings)}.`;
    }
    
    // Update comparison tab
    document.getElementById('oldGrossIncome').textContent = formatCurrency(oldRegime.grossIncome);
    document.getElementById('newGrossIncome').textContent = formatCurrency(newRegime.grossIncome);
    document.getElementById('oldStandardDeduction').textContent = formatCurrency(oldRegime.standardDeduction);
    document.getElementById('newStandardDeduction').textContent = formatCurrency(newRegime.standardDeduction);
    document.getElementById('oldOtherDeductions').textContent = formatCurrency(oldRegime.otherDeductions);
    document.getElementById('oldTaxableIncome').textContent = formatCurrency(oldRegime.taxableIncome);
    document.getElementById('newTaxableIncome').textContent = formatCurrency(newRegime.taxableIncome);
    document.getElementById('oldTaxBeforeCess').textContent = formatCurrency(oldRegime.taxBeforeCess);
    document.getElementById('newTaxBeforeCess').textContent = formatCurrency(newRegime.taxBeforeCess);
    document.getElementById('oldCess').textContent = formatCurrency(oldRegime.cess);
    document.getElementById('newCess').textContent = formatCurrency(newRegime.cess);
    document.getElementById('oldTaxLiability').textContent = formatCurrency(oldRegime.taxLiability);
    document.getElementById('newTaxLiability').textContent = formatCurrency(newRegime.taxLiability);
    
    // Update old regime tab
    document.getElementById('oldDetailGrossIncome').textContent = formatCurrency(oldRegime.grossIncome);
    document.getElementById('oldDetailStandardDeduction').textContent = formatCurrency(oldRegime.standardDeduction);
    document.getElementById('oldDetailOtherDeductions').textContent = formatCurrency(oldRegime.otherDeductions);
    document.getElementById('oldDetailTaxableIncome').textContent = formatCurrency(oldRegime.taxableIncome);
    document.getElementById('oldDetailBaseTax').textContent = formatCurrency(oldRegime.baseTax);
    document.getElementById('oldDetailSurcharge').textContent = formatCurrency(oldRegime.surcharge);
    document.getElementById('oldDetailCess').textContent = formatCurrency(oldRegime.cess);
    document.getElementById('oldDetailTaxLiability').textContent = formatCurrency(oldRegime.taxLiability);
    
    // Update new regime tab
    document.getElementById('newDetailGrossIncome').textContent = formatCurrency(newRegime.grossIncome);
    document.getElementById('newDetailStandardDeduction').textContent = formatCurrency(newRegime.standardDeduction);
    document.getElementById('newDetailTaxableIncome').textContent = formatCurrency(newRegime.taxableIncome);
    document.getElementById('newDetailBaseTax').textContent = formatCurrency(newRegime.baseTax);
    document.getElementById('newDetailSurcharge').textContent = formatCurrency(newRegime.surcharge);
    document.getElementById('newDetailCess').textContent = formatCurrency(newRegime.cess);
    document.getElementById('newDetailTaxLiability').textContent = formatCurrency(newRegime.taxLiability);
    
    // Update tax savings text
    const taxSavingsText = document.getElementById('taxSavingsText');
    taxSavingsText.innerHTML = `
        <i class="fas fa-piggy-bank me-2"></i>
        By choosing the ${recommendedRegime === 'new' ? 'New' : 'Old'} Tax Regime, you save 
        <strong>${formatCurrency(taxSavings)}</strong> on your tax bill.
    `;
    taxSavingsText.className = recommendedRegime === 'new' ? 'alert alert-success' : 'alert alert-info';
    
    // Create charts
    createTaxComparisonChart(oldRegime.taxLiability, newRegime.taxLiability);
}