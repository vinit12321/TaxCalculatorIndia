// --- Constants for Tax Rules (FY 2025-26 Budget 2025) ---
const CESS_RATE = 0.04;

// Old Regime Specifics
const OLD_REGIME_STD_DEDUCTION_SALARIED = 50000;
const OLD_REGIME_REBATE_LIMIT_INCOME = 500000;
const OLD_REGIME_REBATE_MAX_AMOUNT = 12500;
const OLD_REGIME_SLABS = {
    'below_60': [
        { limit: 250000, rate: 0.00 },
        { limit: 500000, rate: 0.05 },
        { limit: 1000000, rate: 0.20 },
        { limit: Infinity, rate: 0.30 }
    ],
    '60_to_80': [
        { limit: 300000, rate: 0.00 },
        { limit: 500000, rate: 0.05 },
        { limit: 1000000, rate: 0.20 },
        { limit: Infinity, rate: 0.30 }
    ],
    'above_80': [
        { limit: 500000, rate: 0.00 },
        { limit: 1000000, rate: 0.20 },
        { limit: Infinity, rate: 0.30 }
    ]
};
const OLD_REGIME_SURCHARGE_RATES = [
    { threshold: 5000000, rate: 0.00 },
    { threshold: 10000000, rate: 0.10 },
    { threshold: 20000000, rate: 0.15 },
    { threshold: 50000000, rate: 0.25 },
    { threshold: Infinity, rate: 0.37 } // Technically threshold should be 5Cr
];

// New Regime Specifics (FY 2025-26)
const NEW_REGIME_STD_DEDUCTION_SALARIED = 75000;
const NEW_REGIME_REBATE_LIMIT_INCOME = 1200000;
const NEW_REGIME_SLABS = [
    { limit: 400000, rate: 0.00 },
    { limit: 800000, rate: 0.05 },
    { limit: 1200000, rate: 0.10 },
    { limit: 1600000, rate: 0.15 },
    { limit: 2000000, rate: 0.20 },
    { limit: 2400000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 }
];
const NEW_REGIME_SURCHARGE_RATES = [
    { threshold: 5000000, rate: 0.00 },
    { threshold: 10000000, rate: 0.10 },
    { threshold: 20000000, rate: 0.15 },
    { threshold: Infinity, rate: 0.25 } // Max 25%
];

// Deduction Limits (Old Regime Primarily)
const LIMIT_80C_CCC_CCD1 = 150000;
const LIMIT_80CCD1B = 50000;
const LIMIT_SEC24B_LOSS = 200000;
const LIMIT_PROF_TAX = 2500;

// --- Helper Functions (JavaScript) ---

// Calculates tax based on income slabs
function calculateSlabTaxJS(taxableIncome, slabs) {
    let tax = 0;
    let previousSlabLimit = 0;
    for (const slab of slabs) {
        if (taxableIncome > previousSlabLimit) {
            const incomeInSlab = Math.min(taxableIncome - previousSlabLimit, slab.limit - previousSlabLimit);
            tax += incomeInSlab * slab.rate;
            previousSlabLimit = slab.limit;
        } else {
            break;
        }
    }
    return tax;
}

// Calculates surcharge and applies marginal relief
function calculateSurchargeAndReliefJS(taxableIncome, baseTax, surchargeRates, regimeSlabs) {
    let surcharge = 0;
    let surchargeRate = 0;
    let applicableThreshold = 0;

    // Find applicable surcharge rate and threshold
    // Iterate backwards to find the highest applicable threshold first
    for (let i = surchargeRates.length - 1; i >= 0; i--) {
        // Check if income EXCEEDS the threshold (Infinity is handled implicitly)
        if (surchargeRates[i].threshold !== Infinity && taxableIncome > surchargeRates[i].threshold) {
            surchargeRate = surchargeRates[i + 1] ? surchargeRates[i + 1].rate : surchargeRates[i].rate; // The rate applies ABOVE the threshold
            applicableThreshold = surchargeRates[i].threshold;
             // Check for the rate for the threshold itself
             if (i+1 < surchargeRates.length){
                 surchargeRate = surchargeRates[i+1].rate;
             } else {
                 surchargeRate = surchargeRates[i].rate; // Highest rate if above last defined threshold
             }

            break; // Found the highest applicable threshold
        }
        // Handle the base case (income <= 50L)
        if (i === 0 && taxableIncome <= surchargeRates[i].threshold) {
            surchargeRate = surchargeRates[i].rate; // Should be 0%
            applicableThreshold = 0; // Or based on the lowest threshold if defined differently
            break;
        }

         // If income exactly matches a threshold or is between thresholds
        if (i > 0 && taxableIncome <= surchargeRates[i].threshold && taxableIncome > surchargeRates[i-1].threshold) {
             surchargeRate = surchargeRates[i].rate;
             applicableThreshold = surchargeRates[i-1].threshold;
             break;
         }
    }


    if (surchargeRate > 0 && applicableThreshold > 0) { // Surcharge applies only above the first threshold
        surcharge = baseTax * surchargeRate;
        let relief = 0;

        // Find the surcharge rate JUST BELOW the current applicable rate
        let thresholdRateInfo = { threshold: 0, rate: 0.00 }; // Default for base case
        for (let i = 0; i < surchargeRates.length; i++) {
             if (surchargeRates[i].threshold === applicableThreshold) {
                 thresholdRateInfo = surchargeRates[i]; // The rate AT the threshold limit
                 break;
             }
         }

        // Calculate tax AT the threshold
        const taxAtThreshold = calculateSlabTaxJS(applicableThreshold, regimeSlabs);
        const surchargeAtThreshold = taxAtThreshold * thresholdRateInfo.rate; // Surcharge using the rate for the threshold level
        const totalTaxAtThreshold = taxAtThreshold + surchargeAtThreshold;

        // Calculate maximum allowed tax = Tax at threshold + 100% of income above threshold
        const incomeAboveThreshold = taxableIncome - applicableThreshold;
        const maxPayableTaxPlusSurcharge = totalTaxAtThreshold + incomeAboveThreshold;

        // Apply Marginal Relief
        const calculatedTaxPlusSurcharge = baseTax + surcharge;
        if (calculatedTaxPlusSurcharge > maxPayableTaxPlusSurcharge) {
            relief = calculatedTaxPlusSurcharge - maxPayableTaxPlusSurcharge;
            surcharge = maxPayableTaxPlusSurcharge - baseTax; // Adjusted surcharge
            surcharge = Math.max(0, surcharge); // Ensure non-negative
            // console.log(`Marginal Relief Applied: ${relief}`);
        }
    }
    return surcharge;
}


// Calculate eligible Chapter VI-A deductions (Old Regime)
function calculateEligibleChapViaDeductionsJS(deductions) {
    let totalDeduction = 0;

    // Ensure deductions are numbers, default to 0 if not
    const safeGet = (key) => parseFloat(deductions[key]) || 0;

    // Section 80C group (80C, 80CCC, 80CCD(1))
    const sec80cGroup = safeGet('section_80c') + safeGet('section_80ccc') + safeGet('section_80ccd1');
    totalDeduction += Math.min(sec80cGroup, LIMIT_80C_CCC_CCD1);

    // Section 80CCD(1B) - Additional NPS
    totalDeduction += Math.min(safeGet('section_80ccd_1b'), LIMIT_80CCD1B);

    // Section 80D - Medical Insurance (Simplified max cap)
    totalDeduction += Math.min(safeGet('section_80d'), 100000);

    // Section 80E - Education Loan Interest (No Limit on amount)
    totalDeduction += safeGet('section_80e');

    // Section 80G - Donations (Assuming eligible amount provided)
    totalDeduction += safeGet('section_80g');

    // Section 80TTA/TTB - Interest (Simplified max cap)
    totalDeduction += Math.min(safeGet('section_80tta_ttb'), 50000);

    // Other sections
    totalDeduction += Math.min(safeGet('section_80ddb'), 100000); // Simplified
    totalDeduction += Math.min(safeGet('section_80u'), 125000); // Simplified
    totalDeduction += safeGet('section_80gg'); // Complex calc needed

    return totalDeduction;
}

// --- Regime Specific Tax Calculations (JavaScript) ---

// Calculate Old Regime Tax
function calculateOldRegimeTaxJS(annualSalary, ageCategory, deductions, isSalaried, professionalTax) {
    let results = {};

    // 1. Income Adjustments
    const currentStandardDeduction = isSalaried ? OLD_REGIME_STD_DEDUCTION_SALARIED : 0;
    const currentProfessionalTax = Math.min(professionalTax || 0, LIMIT_PROF_TAX);
    const sec24bInterest = parseFloat(deductions.section_24b) || 0;
    const housePropertyLoss = Math.min(sec24bInterest, LIMIT_SEC24B_LOSS);

    const incomeAfterSec16Hp = annualSalary - currentStandardDeduction - currentProfessionalTax - housePropertyLoss;
    const grossTotalIncome = Math.max(0, incomeAfterSec16Hp); // Approx GTI

    // 2. Chapter VI-A Deductions
    const chapViaDeductions = calculateEligibleChapViaDeductionsJS(deductions);

    // 3. Taxable Income
    const taxableIncome = Math.max(0, grossTotalIncome - chapViaDeductions);
    results.taxable_income = taxableIncome;

    // 4. Base Tax
    const slabs = OLD_REGIME_SLABS[ageCategory] || OLD_REGIME_SLABS['below_60']; // Fallback
    const baseTax = calculateSlabTaxJS(taxableIncome, slabs);

    // 5. Rebate 87A
    let rebate = 0;
    if (taxableIncome <= OLD_REGIME_REBATE_LIMIT_INCOME) {
        rebate = Math.min(baseTax, OLD_REGIME_REBATE_MAX_AMOUNT);
    }
    const taxAfterRebate = Math.max(0, baseTax - rebate);

    // 6. Surcharge
    const surcharge = calculateSurchargeAndReliefJS(taxableIncome, taxAfterRebate, OLD_REGIME_SURCHARGE_RATES, slabs);

    // 7. Cess
    const totalTaxBeforeCess = taxAfterRebate + surcharge;
    const cess = Math.ceil(totalTaxBeforeCess * CESS_RATE); // Use Math.ceil for cess

    // 8. Final Tax Liability
    results.tax_liability = totalTaxBeforeCess + cess;

    // Store details
    results.gross_income = annualSalary;
    results.standard_deduction = currentStandardDeduction;
    results.professional_tax = currentProfessionalTax;
    results.house_property_loss_adj = housePropertyLoss;
    results.chap_via_deductions = chapViaDeductions;
    results.gross_total_income_approx = grossTotalIncome;
    results.breakdown = {
        base_tax: baseTax,
        rebate: rebate,
        surcharge: surcharge,
        cess: cess
    };

    return results;
}

// Calculate New Regime Tax
function calculateNewRegimeTaxJS(annualSalary, isSalaried) {
    let results = {};

    // 1. Taxable Income
    const currentStandardDeduction = isSalaried ? NEW_REGIME_STD_DEDUCTION_SALARIED : 0;
    const taxableIncome = Math.max(0, annualSalary - currentStandardDeduction);
    results.taxable_income = taxableIncome;

    // 2. Base Tax
    const baseTax = calculateSlabTaxJS(taxableIncome, NEW_REGIME_SLABS);

    // 3. Rebate 87A (FY 2025-26)
    let rebate = 0;
    if (taxableIncome <= NEW_REGIME_REBATE_LIMIT_INCOME) {
        rebate = baseTax; // Tax becomes zero
    }
    const taxAfterRebate = Math.max(0, baseTax - rebate);

    // 4. Surcharge
    const surcharge = calculateSurchargeAndReliefJS(taxableIncome, taxAfterRebate, NEW_REGIME_SURCHARGE_RATES, NEW_REGIME_SLABS);

    // 5. Cess
    const totalTaxBeforeCess = taxAfterRebate + surcharge;
    const cess = Math.ceil(totalTaxBeforeCess * CESS_RATE); // Use Math.ceil for cess

    // 6. Final Tax Liability
    results.tax_liability = totalTaxBeforeCess + cess;

    // Store details
    results.gross_income = annualSalary;
    results.standard_deduction = currentStandardDeduction;
    results.breakdown = {
        base_tax: baseTax,
        rebate: rebate,
        surcharge: surcharge,
        cess: cess
    };

    return results;
}

// --- Main Client-Side Calculation Function ---
function calculateTaxClientSide(annualSalary, ageCategory, deductions, isSalaried, professionalTax) {
    try {
        // Basic Input Validation (can be enhanced)
        if (isNaN(annualSalary) || annualSalary < 0) throw new Error("Invalid Annual Salary.");
        if (!['below_60', '60_to_80', 'above_80'].includes(ageCategory)) throw new Error("Invalid Age Category.");
        if (isNaN(professionalTax) || professionalTax < 0) throw new Error("Invalid Professional Tax.");
        // Add validation for deductions if needed

        // Calculate for both regimes using JS functions
        const oldRegimeResults = calculateOldRegimeTaxJS(annualSalary, ageCategory, deductions, isSalaried, professionalTax);
        const newRegimeResults = calculateNewRegimeTaxJS(annualSalary, isSalaried);

        // Compare results
        const oldTax = oldRegimeResults.tax_liability;
        const newTax = newRegimeResults.tax_liability;
        const recommendedRegime = newTax <= oldTax ? "new" : "old";
        const taxSavings = Math.abs(oldTax - newTax);

        return {
            status: 'success',
            calculation_assumptions: 'FY 2025-26 Rules (Budget 2025) - Client-Side Calc.',
            old_regime: oldRegimeResults,
            new_regime: newRegimeResults,
            recommended_regime: recommendedRegime,
            tax_savings_by_recommendation: taxSavings
        };

    } catch (error) {
        console.error("Calculation Error:", error);
        return {
            status: 'error',
            message: `Calculation Error: ${error.message}`
        };
    }
}

// --- Event Listeners and DOM Manipulation ---

// Format currency helper (remains same)
function formatCurrency(amount) {
    if (isNaN(parseFloat(amount))) {
        return '-';
    }
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    });
}

// Update Old Regime Slabs display (remains same)
function updateOldRegimeSlabs(ageCategory) {
    // ... (keep the existing function as provided before) ...
     const oldRegimeSlabsBody = document.getElementById('oldRegimeSlabsBody');
    if (!oldRegimeSlabsBody) return; // Exit if element not found
    oldRegimeSlabsBody.innerHTML = ''; // Clear previous slabs

    let slabsHtml = '';
    if (ageCategory === 'below_60') {
        slabsHtml = `
            <tr><td>Up to 2,50,000</td><td class="text-center">0%</td></tr>
            <tr><td>2,50,001 - 5,00,000</td><td class="text-center">5%</td></tr>
            <tr><td>5,00,001 - 10,00,000</td><td class="text-center">20%</td></tr>
            <tr><td>Above 10,00,000</td><td class="text-center">30%</td></tr>
        `;
    } else if (ageCategory === '60_to_80') {
        slabsHtml = `
            <tr><td>Up to 3,00,000</td><td class="text-center">0%</td></tr>
            <tr><td>3,00,001 - 5,00,000</td><td class="text-center">5%</td></tr>
            <tr><td>5,00,001 - 10,00,000</td><td class="text-center">20%</td></tr>
            <tr><td>Above 10,00,000</td><td class="text-center">30%</td></tr>
        `;
    } else if (ageCategory === 'above_80') {
        slabsHtml = `
            <tr><td>Up to 5,00,000</td><td class="text-center">0%</td></tr>
            <tr><td>5,00,001 - 10,00,000</td><td class="text-center">20%</td></tr>
            <tr><td>Above 10,00,000</td><td class="text-center">30%</td></tr>
        `;
    }
     oldRegimeSlabsBody.innerHTML = slabsHtml;
}

// Display calculation results (remains mostly same, uses JS data structure)
function displayResults(data) {
   // ... (keep the existing displayResults function as provided in the previous JS update) ...
   // It already uses the correct structure returned by calculateTaxClientSide
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) return;

    if (data.status === 'error') {
        // Show error message gracefully
        const recommendationTextEl = document.getElementById('recommendationText');
        const taxRecommendationEl = document.getElementById('taxRecommendation');
        if (recommendationTextEl && taxRecommendationEl) {
             recommendationTextEl.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> Error: ${data.message}`;
             taxRecommendationEl.className = 'alert alert-danger mb-4 text-center fs-5'; // Error style
        } else {
            alert('Error: ' + data.message); // Fallback
        }
        resultsSection.classList.remove('d-none'); // Show section to display error
        return;
    }

    // --- Update Recommendation ---
    const recommendationTextEl = document.getElementById('recommendationText');
    const taxRecommendationEl = document.getElementById('taxRecommendation');
    const taxSavingsTextEl = document.getElementById('taxSavingsText');
    const savings = data.tax_savings_by_recommendation;
    const recommended = data.recommended_regime;

    if (savings > 0) {
         recommendationTextEl.innerHTML = `Choose the <strong>${recommended === 'new' ? 'New' : 'Old'} Tax Regime</strong> to save approx. <strong>${formatCurrency(savings)}</strong>`;
         taxRecommendationEl.className = `alert ${recommended === 'new' ? 'alert-success' : 'alert-info'} mb-4 text-center fs-5`;
         taxSavingsTextEl.innerHTML = `<i class="fas fa-info-circle me-2"></i> Choosing the ${recommended === 'new' ? 'New' : 'Old'} Regime saves ~${formatCurrency(savings)}.`;
    } else {
        recommendationTextEl.innerHTML = `Both tax regimes result in approx. the same tax liability.`;
        taxRecommendationEl.className = 'alert alert-secondary mb-4 text-center fs-5';
        taxSavingsTextEl.innerHTML = `<i class="fas fa-info-circle me-2"></i> Tax liability is similar under both regimes.`;
    }

    // --- Update Comparison Tab ---
    const oldData = data.old_regime;
    const newData = data.new_regime;

    // Helper to update element text
    const updateText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = formatCurrency(value);
         else console.warn(`Element with ID ${id} not found.`); // Add warning
    };

    updateText('oldGrossIncome', oldData.gross_income);
    updateText('newGrossIncome', newData.gross_income);
    updateText('oldStandardDeduction', oldData.standard_deduction);
    updateText('newStandardDeduction', newData.standard_deduction);
    updateText('oldProfTaxDed', oldData.professional_tax); // Old only
    updateText('oldHPLossDed', oldData.house_property_loss_adj); // Old only
    updateText('oldOtherDeductions', oldData.chap_via_deductions); // Chap VI A
    updateText('oldTaxableIncome', oldData.taxable_income);
    updateText('newTaxableIncome', newData.taxable_income);
    updateText('oldBaseTaxComp', oldData.breakdown.base_tax);
    updateText('newBaseTaxComp', newData.breakdown.base_tax);
    updateText('oldRebateComp', oldData.breakdown.rebate);
    updateText('newRebateComp', newData.breakdown.rebate);
    updateText('oldSurchargeComp', oldData.breakdown.surcharge);
    updateText('newSurchargeComp', newData.breakdown.surcharge);
    updateText('oldCessComp', oldData.breakdown.cess);
    updateText('newCessComp', newData.breakdown.cess);
    updateText('oldTaxLiability', oldData.tax_liability);
    updateText('newTaxLiability', newData.tax_liability);


    // --- Update Old Regime Detailed Tab ---
    updateText('oldDetailGrossIncome', oldData.gross_income);
    updateText('oldDetailStandardDeduction', oldData.standard_deduction);
    updateText('oldDetailProfTaxDed', oldData.professional_tax);
    updateText('oldDetailHPLossDed', oldData.house_property_loss_adj);
    updateText('oldDetailGTI', oldData.gross_total_income_approx);
    updateText('oldDetailChapVIADed', oldData.chap_via_deductions);
    updateText('oldDetailTaxableIncome', oldData.taxable_income);
    updateText('oldDetailBaseTax', oldData.breakdown.base_tax);
    updateText('oldDetailRebate', oldData.breakdown.rebate);
    const oldTaxAfterRebate = oldData.breakdown.base_tax - oldData.breakdown.rebate;
    updateText('oldDetailTaxAfterRebate', oldTaxAfterRebate > 0 ? oldTaxAfterRebate : 0);
    updateText('oldDetailSurcharge', oldData.breakdown.surcharge);
    const oldTaxPlusSurcharge = (oldTaxAfterRebate > 0 ? oldTaxAfterRebate : 0) + oldData.breakdown.surcharge;
    updateText('oldDetailTaxPlusSurcharge', oldTaxPlusSurcharge);
    updateText('oldDetailCess', oldData.breakdown.cess);
    updateText('oldDetailTaxLiability', oldData.tax_liability);

    // --- Update New Regime Detailed Tab ---
    updateText('newDetailGrossIncome', newData.gross_income);
    updateText('newDetailStandardDeduction', newData.standard_deduction);
    updateText('newDetailTaxableIncome', newData.taxable_income);
    updateText('newDetailBaseTax', newData.breakdown.base_tax);
    updateText('newDetailRebate', newData.breakdown.rebate);
    const newTaxAfterRebate = newData.breakdown.base_tax - newData.breakdown.rebate;
    updateText('newDetailTaxAfterRebate', newTaxAfterRebate > 0 ? newTaxAfterRebate : 0);
    updateText('newDetailSurcharge', newData.breakdown.surcharge);
     const newTaxPlusSurcharge = (newTaxAfterRebate > 0 ? newTaxAfterRebate : 0) + newData.breakdown.surcharge;
    updateText('newDetailTaxPlusSurcharge', newTaxPlusSurcharge);
    updateText('newDetailCess', newData.breakdown.cess);
    updateText('newDetailTaxLiability', newData.tax_liability);

    // Update dynamic Old Regime Slabs display
    updateOldRegimeSlabs(document.getElementById('age_category').value);

    // --- Create Chart ---
    if (typeof createTaxComparisonChart === 'function') {
        setTimeout(() => {
             createTaxComparisonChart(oldData.tax_liability, newData.tax_liability);
        }, 100); // Delay ensures canvas is ready
    } else {
        console.error("createTaxComparisonChart function not found.");
    }

    // Show results section and scroll to it
    resultsSection.classList.remove('d-none');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    const taxCalculatorForm = document.getElementById('taxCalculatorForm');
    const resetFormButton = document.getElementById('resetForm');
    const ageCategorySelect = document.getElementById('age_category');

    if (!taxCalculatorForm || !resetFormButton || !ageCategorySelect) {
        console.error("Essential form elements not found!");
        return;
    }

    // Initialize old regime slabs display
    updateOldRegimeSlabs(ageCategorySelect.value);

    // Update old regime slabs display when age category changes
    ageCategorySelect.addEventListener('change', function() {
        updateOldRegimeSlabs(this.value);
    });

    // Reset form handler
    resetFormButton.addEventListener('click', function() {
        taxCalculatorForm.reset();
        document.getElementById('resultsSection').classList.add('d-none');
        updateOldRegimeSlabs('below_60');
        if (window.taxComparisonChart) {
            window.taxComparisonChart.destroy();
        }
    });

    // Form submission handler - NOW USES CLIENT-SIDE CALCULATION
    taxCalculatorForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission

        // --- Get All Inputs ---
        const annualSalary = parseFloat(document.getElementById('annual_salary').value) || 0;
        const ageCategory = ageCategorySelect.value;
        const isSalaried = document.getElementById('is_salaried').checked;
        const professionalTax = parseFloat(document.getElementById('professional_tax').value) || 0;

        // Get deduction values
        const deductions = {
            section_80c: document.getElementById('section_80c').value,
            section_80d: document.getElementById('section_80d').value,
            section_24b: document.getElementById('section_24b').value,
            section_80e: document.getElementById('section_80e').value,
            section_80g: document.getElementById('section_80g').value,
            section_80tta_ttb: document.getElementById('section_80tta_ttb').value,
            section_80ccd_1b: document.getElementById('section_80ccd_1b').value,
            section_80ddb: document.getElementById('section_80ddb').value,
            section_80gg: document.getElementById('section_80gg').value,
            section_80u: document.getElementById('section_80u').value
            // Add other deduction fields if they exist in HTML
        };
         // Convert deduction values to numbers safely
         for (const key in deductions) {
            deductions[key] = parseFloat(deductions[key]) || 0;
         }


        // --- Perform Client-Side Calculation ---
        const result = calculateTaxClientSide(
            annualSalary,
            ageCategory,
            deductions,
            isSalaried,
            professionalTax
        );

        // --- Display Results ---
        displayResults(result);
    });
});