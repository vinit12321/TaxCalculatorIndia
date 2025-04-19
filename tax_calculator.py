import math

# --- Constants for Tax Rules (FY 2025-26 based on Budget 2025) ---

# Common
CESS_RATE = 0.04

# Old Regime Specifics
OLD_REGIME_STD_DEDUCTION_SALARIED = 50000 # For < 80 years generally
OLD_REGIME_REBATE_LIMIT_INCOME = 500000
OLD_REGIME_REBATE_MAX_AMOUNT = 12500
OLD_REGIME_SLABS = {
    'below_60': [
        (250000, 0.00),  # Up to 2.5L
        (500000, 0.05),  # 2.5L to 5L
        (1000000, 0.20), # 5L to 10L
        (float('inf'), 0.30) # Above 10L
    ],
    '60_to_80': [
        (300000, 0.00),  # Up to 3L
        (500000, 0.05),  # 3L to 5L
        (1000000, 0.20), # 5L to 10L
        (float('inf'), 0.30) # Above 10L
    ],
    'above_80': [
        (500000, 0.00),  # Up to 5L
        (1000000, 0.20), # 5L to 10L
        (float('inf'), 0.30) # Above 10L
        # Note: Std Deduction for >80 might be 1L as per some sources, but kept 50k here for consistency unless specified
    ]
}
OLD_REGIME_SURCHARGE_RATES = [
    (5000000, 0.00),   # Up to 50L
    (10000000, 0.10),  # 50L to 1Cr
    (20000000, 0.15),  # 1Cr to 2Cr
    (50000000, 0.25),  # 2Cr to 5Cr
    (float('inf'), 0.37) # Above 5Cr
]

# New Regime Specifics (FY 2025-26)
NEW_REGIME_STD_DEDUCTION_SALARIED = 75000 # As per Budget 2025
NEW_REGIME_REBATE_LIMIT_INCOME = 1200000 # As per Budget 2025
# NEW_REGIME_REBATE_MAX_AMOUNT = 60000 # Mentioned in sources, but mechanism makes tax zero
NEW_REGIME_SLABS = [ # As per Budget 2025
    (400000, 0.00),     # Up to 4L
    (800000, 0.05),     # 4L to 8L
    (1200000, 0.10),    # 8L to 12L
    (1600000, 0.15),    # 12L to 16L
    (2000000, 0.20),    # 16L to 20L
    (2400000, 0.25),    # 20L to 24L
    (float('inf'), 0.30)   # Above 24L
]
NEW_REGIME_SURCHARGE_RATES = [ # Max rate capped at 25%
    (5000000, 0.00),   # Up to 50L
    (10000000, 0.10),  # 50L to 1Cr
    (20000000, 0.15),  # 1Cr to 2Cr
    (float('inf'), 0.25)   # Above 2Cr
]

# Deduction Limits (Old Regime Primarily)
LIMIT_80C_CCC_CCD1 = 150000
LIMIT_80CCD1B = 50000
LIMIT_SEC24B_LOSS = 200000

# --- Helper Functions ---

def calculate_slab_tax(taxable_income, slabs):
    """Calculates tax based on income slabs."""
    tax = 0
    previous_slab_limit = 0
    for limit, rate in slabs:
        if taxable_income > previous_slab_limit:
            income_in_slab = min(taxable_income - previous_slab_limit, limit - previous_slab_limit)
            tax += income_in_slab * rate
            previous_slab_limit = limit
        else:
            break
    return tax

def calculate_surcharge_and_relief(taxable_income, base_tax, surcharge_rates, regime_slabs, age_category=None):
    """
    Calculates surcharge and applies marginal relief.
    Requires regime_slabs for relief calculation.
    Requires age_category for old regime slab selection during relief calc.
    """
    surcharge = 0
    surcharge_rate = 0
    applicable_threshold = 0

    # Find applicable surcharge rate
    for threshold, rate in surcharge_rates:
        if taxable_income > threshold:
            surcharge_rate = rate
            applicable_threshold = threshold
        else:
            break

    if surcharge_rate > 0:
        surcharge = base_tax * surcharge_rate
        relief = 0

        # Determine slabs for threshold calculation
        threshold_slabs = regime_slabs
        if age_category and isinstance(regime_slabs, dict): # Old regime check
             if age_category in regime_slabs:
                 threshold_slabs = regime_slabs[age_category]
             else: # Default if age category invalid (should not happen with validation)
                 threshold_slabs = regime_slabs.get('below_60', [])


        # Find the rate just below the current one
        threshold_rate_info = None
        for i in range(len(surcharge_rates)):
            if surcharge_rates[i][0] == applicable_threshold:
                threshold_rate_info = surcharge_rates[i - 1] if i > 0 else (0, 0.00)
                break

        if threshold_rate_info is not None and threshold_slabs:
            # Calculate tax just AT the threshold
            tax_at_threshold = calculate_slab_tax(applicable_threshold, threshold_slabs)

            # Surcharge AT the threshold (using the rate JUST BELOW the current income's rate)
            surcharge_at_threshold = tax_at_threshold * threshold_rate_info[1] # Use previous rate
            total_tax_at_threshold = tax_at_threshold + surcharge_at_threshold

            # Calculate maximum allowed tax: Tax at threshold + 100% of income above threshold
            income_above_threshold = taxable_income - applicable_threshold
            max_payable_tax_plus_surcharge = total_tax_at_threshold + income_above_threshold

            # Apply Marginal Relief if calculated tax + surcharge exceeds max allowed
            calculated_tax_plus_surcharge = base_tax + surcharge
            if calculated_tax_plus_surcharge > max_payable_tax_plus_surcharge:
                relief = calculated_tax_plus_surcharge - max_payable_tax_plus_surcharge
                surcharge = max_payable_tax_plus_surcharge - base_tax # Adjusted surcharge
                surcharge = max(0, surcharge) # Ensure surcharge isn't negative

    return surcharge


def calculate_eligible_chap_via_deductions(deductions):
    """
    Calculate eligible Chapter VI-A deductions (primarily for Old Regime).
    Note: This is simplified. Actual 80D, 80G etc., have complex sub-limits.
    """
    total_deduction = 0
    # Section 80C, 80CCC, 80CCD(1) - Combined limit
    sec_80c_group = float(deductions.get('section_80c', 0)) + \
                    float(deductions.get('section_80ccc', 0)) + \
                    float(deductions.get('section_80ccd1', 0))
    total_deduction += min(sec_80c_group, LIMIT_80C_CCC_CCD1)

    # Section 80CCD(1B) - Additional NPS
    total_deduction += min(float(deductions.get('section_80ccd_1b', 0)), LIMIT_80CCD1B)

    # Section 80D - Medical Insurance (Simplified max cap)
    total_deduction += min(float(deductions.get('section_80d', 0)), 100000)

    # Section 80E - Education Loan Interest (No Limit on amount)
    total_deduction += float(deductions.get('section_80e', 0))

    # Section 80G - Donations (Assuming eligible amount provided)
    total_deduction += float(deductions.get('section_80g', 0))

    # Section 80TTA/TTB - Interest (Simplified max cap)
    total_deduction += min(float(deductions.get('section_80tta_ttb', 0)), 50000)

    # Other sections
    total_deduction += min(float(deductions.get('section_80ddb', 0)), 100000) # Simplified
    total_deduction += min(float(deductions.get('section_80u', 0)), 125000) # Simplified
    total_deduction += float(deductions.get('section_80gg', 0)) # Complex calc needed

    return total_deduction

# --- Regime Specific Tax Calculations ---

def calculate_old_regime_tax(annual_salary, age_category, deductions, is_salaried, professional_tax):
    """Calculate tax under the old regime for FY 2025-26."""
    results = {}

    # 1. Calculate Income Adjustments
    # Use OLD regime standard deduction
    current_standard_deduction = OLD_REGIME_STD_DEDUCTION_SALARIED if is_salaried else 0
    current_professional_tax = min(professional_tax, 2500) # Max PT allowed

    sec_24b_interest = float(deductions.get('section_24b', 0))
    house_property_loss = min(sec_24b_interest, LIMIT_SEC24B_LOSS) if sec_24b_interest > 0 else 0

    income_after_sec16_hp = annual_salary - current_standard_deduction - current_professional_tax - house_property_loss
    gross_total_income = max(0, income_after_sec16_hp) # Approximation

    # 2. Calculate Chapter VI-A Deductions
    chap_via_deductions = calculate_eligible_chap_via_deductions(deductions)

    # 3. Calculate Taxable Income
    taxable_income = max(0, gross_total_income - chap_via_deductions)
    results['taxable_income'] = taxable_income

    # 4. Calculate Base Tax using Slabs based on Age
    if age_category not in OLD_REGIME_SLABS:
        raise ValueError("Invalid age_category. Use 'below_60', '60_to_80', or 'above_80'.")
    slabs = OLD_REGIME_SLABS[age_category]
    base_tax = calculate_slab_tax(taxable_income, slabs)
    results['tax_before_rebate_cess'] = base_tax

    # 5. Apply Rebate under Section 87A
    rebate = 0
    if taxable_income <= OLD_REGIME_REBATE_LIMIT_INCOME:
        rebate = min(base_tax, OLD_REGIME_REBATE_MAX_AMOUNT)
    tax_after_rebate = max(0, base_tax - rebate)
    results['rebate_87a'] = rebate

    # 6. Calculate Surcharge
    surcharge = calculate_surcharge_and_relief(
        taxable_income,
        tax_after_rebate,
        OLD_REGIME_SURCHARGE_RATES,
        OLD_REGIME_SLABS, # Pass slab dict
        age_category      # Pass age for correct slab selection in relief calc
    )
    results['surcharge'] = surcharge

    # 7. Calculate Health and Education Cess
    total_tax_before_cess = tax_after_rebate + surcharge
    cess = math.ceil(total_tax_before_cess * CESS_RATE)
    results['cess'] = cess

    # 8. Calculate Final Tax Liability
    tax_liability = total_tax_before_cess + cess
    results['tax_liability'] = tax_liability

    # Add other details
    results['gross_income'] = annual_salary
    results['standard_deduction'] = current_standard_deduction # Old Regime SD
    results['professional_tax'] = current_professional_tax
    results['house_property_loss_adj'] = house_property_loss
    results['chap_via_deductions'] = chap_via_deductions
    results['gross_total_income_approx'] = gross_total_income

    # Add breakdown for detailed view
    results['breakdown'] = {
        'base_tax': base_tax,
        'rebate': rebate,
        'surcharge': surcharge,
        'cess': cess
    }

    return results


def calculate_new_regime_tax(annual_salary, is_salaried):
    """Calculate tax under the new (default) regime for FY 2025-26."""
    results = {}

    # 1. Calculate Taxable Income
    # Use NEW regime standard deduction. No other deductions usually allowed (except emp NPS etc.)
    current_standard_deduction = NEW_REGIME_STD_DEDUCTION_SALARIED if is_salaried else 0
    taxable_income = max(0, annual_salary - current_standard_deduction)
    results['taxable_income'] = taxable_income

    # 2. Calculate Base Tax using New Regime Slabs
    base_tax = calculate_slab_tax(taxable_income, NEW_REGIME_SLABS)
    results['tax_before_rebate_cess'] = base_tax

    # 3. Apply Rebate under Section 87A (FY 2025-26 Rule)
    rebate = 0
    if taxable_income <= NEW_REGIME_REBATE_LIMIT_INCOME:
        # If income is within the limit, tax becomes zero due to rebate
        rebate = base_tax
    tax_after_rebate = max(0, base_tax - rebate)
    results['rebate_87a'] = rebate

    # 4. Calculate Surcharge
    surcharge = calculate_surcharge_and_relief(
        taxable_income,
        tax_after_rebate,
        NEW_REGIME_SURCHARGE_RATES,
        NEW_REGIME_SLABS # Pass slab list
    )
    results['surcharge'] = surcharge

    # 5. Calculate Health and Education Cess
    total_tax_before_cess = tax_after_rebate + surcharge
    cess = math.ceil(total_tax_before_cess * CESS_RATE)
    results['cess'] = cess

    # 6. Calculate Final Tax Liability
    tax_liability = total_tax_before_cess + cess
    results['tax_liability'] = tax_liability

    # Add other details
    results['gross_income'] = annual_salary
    results['standard_deduction'] = current_standard_deduction # New Regime SD

    # Add breakdown for detailed view
    results['breakdown'] = {
        'base_tax': base_tax,
        'rebate': rebate,
        'surcharge': surcharge,
        'cess': cess
    }

    return results


# --- Main Calculation Function ---

def calculate_tax(annual_salary, age_category, deductions, is_salaried=True, professional_tax=0):
    """
    Calculate income tax under both old and new regimes for FY 2025-26 (Budget 2025 Rules).

    Parameters:
    annual_salary (float): Annual gross salary (before std deduction, prof tax).
    age_category (str): Age category ('below_60', '60_to_80', 'above_80'). Relevant for Old Regime.
    deductions (dict): Dictionary containing claimed deduction amounts under various sections
                       (e.g., {'section_80c': 150000, 'section_80d': 25000, 'section_24b': 200000}).
                       These are primarily used for the Old Regime.
    is_salaried (bool): True if income is from Salary/Pension. Default True.
    professional_tax (float): Amount of professional tax paid annually. Default 0. Relevant for Old Regime.

    Returns:
    dict: Dictionary containing tax calculations for both regimes and recommendation.
          Returns {'status': 'error', 'message': ...} on failure.
    """
    try:
        # Input Validation
        try:
            annual_salary = float(annual_salary)
            if annual_salary < 0: raise ValueError()
        except:
            raise ValueError("Annual salary must be a non-negative number.")

        if age_category not in ['below_60', '60_to_80', 'above_80']:
             raise ValueError("Invalid age_category. Use 'below_60', '60_to_80', or 'above_80'.")

        if not isinstance(deductions, dict):
             raise ValueError("Deductions must be a dictionary.")

        # Convert deduction values to float, handle potential errors
        for key in deductions:
             try:
                 deductions[key] = float(deductions[key])
                 if deductions[key] < 0: raise ValueError()
             except:
                 raise ValueError(f"Invalid value for deduction '{key}'. Must be a non-negative number.")

        if not isinstance(is_salaried, bool):
             # If coming from form, it might be 'on' or absent
             if isinstance(is_salaried, str) and is_salaried.lower() == 'on':
                 is_salaried = True
             elif is_salaried is None:
                 is_salaried = False
             else:
                  try: # Attempt to interpret common string/numeric representations
                      is_salaried = bool(int(is_salaried)) if str(is_salaried).isdigit() else str(is_salaried).lower() in ['true', 'yes', '1']
                  except:
                      raise ValueError("is_salaried must be True or False (or interpretable as such).")


        try:
            professional_tax = float(professional_tax)
            if professional_tax < 0: raise ValueError()
        except:
             raise ValueError("Professional tax must be a non-negative number.")


        # Calculate tax under old regime
        old_regime_results = calculate_old_regime_tax(
            annual_salary, age_category, deductions, is_salaried, professional_tax
        )

        # Calculate tax under new regime
        new_regime_results = calculate_new_regime_tax(
            annual_salary, is_salaried
        )

        # Determine which regime is better
        old_tax = old_regime_results['tax_liability']
        new_tax = new_regime_results['tax_liability']

        recommended_regime = "new" if new_tax <= old_tax else "old"
        tax_savings = abs(old_tax - new_tax)

        # Return results
        return {
            'status': 'success',
            'calculation_assumptions': 'Based on FY 2025-26 rules (Budget 2025). Surcharge marginal relief calculation is included.',
            'old_regime': old_regime_results,
            'new_regime': new_regime_results,
            'recommended_regime': recommended_regime,
            'tax_savings_by_recommendation': tax_savings
        }

    except ValueError as ve:
        return {'status': 'error', 'message': f"Input Error: {ve}"}
    except Exception as e:
        # Catch any other unexpected errors during calculation
        import traceback
        print(f"Unexpected error: {traceback.format_exc()}") # Log traceback for debugging
        return {'status': 'error', 'message': f"An unexpected error occurred: {e}"}