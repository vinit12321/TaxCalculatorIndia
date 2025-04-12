def calculate_tax(annual_salary, age_category, deductions):
    """
    Calculate income tax under both old and new regimes for FY 2025-26
    
    Parameters:
    annual_salary (float): Annual gross salary
    age_category (str): Age category ('below_60', '60_to_80', 'above_80')
    deductions (dict): Dictionary containing various deduction amounts
    
    Returns:
    dict: Dictionary containing tax calculations for both regimes
    """
    # Calculate tax under old regime
    old_regime = calculate_old_regime_tax(annual_salary, age_category, deductions)
    
    # Calculate tax under new regime
    new_regime = calculate_new_regime_tax(annual_salary)
    
    # Determine which regime is better
    recommended_regime = "new" if new_regime['tax_liability'] <= old_regime['tax_liability'] else "old"
    tax_savings = abs(old_regime['tax_liability'] - new_regime['tax_liability'])
    
    # Return results
    return {
        'status': 'success',
        'old_regime': old_regime,
        'new_regime': new_regime,
        'recommended_regime': recommended_regime,
        'tax_savings': tax_savings
    }

def calculate_old_regime_tax(annual_salary, age_category, deductions):
    """Calculate tax under the old regime"""
    # Standard deduction based on age
    standard_deduction = 50000  # Default for below 60 years
    if age_category == '60_to_80' or age_category == 'above_80':
        standard_deduction = 100000  # Increased for senior citizens as per latest budget
    
    # Calculate total deductions
    total_deductions = standard_deduction
    for key, value in deductions.items():
        total_deductions += value
    
    # Special handling for 80C, 80CCC, and 80CCD(1) combined limit of 1.5 lakh
    section_80c_combined = min(deductions['section_80c'], 150000)
    
    # Calculate taxable income
    taxable_income = max(0, annual_salary - standard_deduction - calculate_eligible_deductions(deductions))
    
    # Apply tax slabs based on age category
    tax = 0
    
    if age_category == 'below_60':
        # For individuals below 60 years
        if taxable_income <= 250000:
            tax = 0
        elif taxable_income <= 500000:
            tax = (taxable_income - 250000) * 0.05
        elif taxable_income <= 1000000:
            tax = 12500 + (taxable_income - 500000) * 0.2
        else:
            tax = 12500 + 100000 + (taxable_income - 1000000) * 0.3
    
    elif age_category == '60_to_80':
        # For senior citizens (60 to 80 years)
        if taxable_income <= 300000:
            tax = 0
        elif taxable_income <= 500000:
            tax = (taxable_income - 300000) * 0.05
        elif taxable_income <= 1000000:
            tax = 10000 + (taxable_income - 500000) * 0.2
        else:
            tax = 10000 + 100000 + (taxable_income - 1000000) * 0.3
    
    elif age_category == 'above_80':
        # For super senior citizens (above 80 years)
        if taxable_income <= 500000:
            tax = 0
        elif taxable_income <= 1000000:
            tax = (taxable_income - 500000) * 0.2
        else:
            tax = 100000 + (taxable_income - 1000000) * 0.3
    
    # Apply rebate u/s 87A (for income up to 5 lakhs)
    if taxable_income <= 500000:
        tax = 0
    
    # Calculate surcharge
    surcharge = 0
    if taxable_income > 5000000 and taxable_income <= 10000000:
        surcharge = tax * 0.1
    elif taxable_income > 10000000 and taxable_income <= 20000000:
        surcharge = tax * 0.15
    elif taxable_income > 20000000 and taxable_income <= 50000000:
        surcharge = tax * 0.25
    elif taxable_income > 50000000:
        surcharge = tax * 0.37
    
    # Add health and education cess (4%)
    cess = (tax + surcharge) * 0.04
    
    # Calculate total tax liability
    tax_liability = tax + surcharge + cess
    
    return {
        'gross_income': annual_salary,
        'standard_deduction': standard_deduction,
        'other_deductions': calculate_eligible_deductions(deductions),
        'taxable_income': taxable_income,
        'tax_before_cess': tax + surcharge,
        'cess': cess,
        'tax_liability': tax_liability,
        'breakdown': {
            'base_tax': tax,
            'surcharge': surcharge,
            'cess': cess
        }
    }

def calculate_new_regime_tax(annual_salary):
    """Calculate tax under the new regime"""
    # Standard deduction for all age groups
    standard_deduction = 75000
    
    # Calculate taxable income
    taxable_income = max(0, annual_salary - standard_deduction)
    
    # Apply tax slabs for new regime
    tax = 0
    
    if taxable_income <= 400000:
        tax = 0
    elif taxable_income <= 800000:
        tax = (taxable_income - 400000) * 0.05
    elif taxable_income <= 1200000:
        tax = 20000 + (taxable_income - 800000) * 0.1
    elif taxable_income <= 1600000:
        tax = 20000 + 40000 + (taxable_income - 1200000) * 0.15
    elif taxable_income <= 2000000:
        tax = 20000 + 40000 + 60000 + (taxable_income - 1600000) * 0.2
    elif taxable_income <= 2400000:
        tax = 20000 + 40000 + 60000 + 80000 + (taxable_income - 2000000) * 0.25
    else:
        tax = 20000 + 40000 + 60000 + 80000 + 100000 + (taxable_income - 2400000) * 0.3
    
    # Apply rebate u/s 87A (for income up to 12 lakhs in new regime)
    if taxable_income <= 1200000:
        tax = 0
    
    # Calculate surcharge (capped at 25% in new regime)
    surcharge = 0
    if taxable_income > 5000000 and taxable_income <= 10000000:
        surcharge = tax * 0.1
    elif taxable_income > 10000000 and taxable_income <= 20000000:
        surcharge = tax * 0.15
    elif taxable_income > 20000000 and taxable_income <= 50000000:
        surcharge = tax * 0.25
    elif taxable_income > 50000000:
        surcharge = tax * 0.25  # Capped at 25% in new regime
    
    # Add health and education cess (4%)
    cess = (tax + surcharge) * 0.04
    
    # Calculate total tax liability
    tax_liability = tax + surcharge + cess
    
    return {
        'gross_income': annual_salary,
        'standard_deduction': standard_deduction,
        'taxable_income': taxable_income,
        'tax_before_cess': tax + surcharge,
        'cess': cess,
        'tax_liability': tax_liability,
        'breakdown': {
            'base_tax': tax,
            'surcharge': surcharge,
            'cess': cess
        }
    }

def calculate_eligible_deductions(deductions):
    """Calculate eligible deductions for old regime"""
    # Section 80C, 80CCC, 80CCD(1) combined limit of 1.5 lakh
    section_80c_limit = min(deductions['section_80c'], 150000)
    
    # Section 80CCD(1B) additional NPS contribution up to 50,000
    section_80ccd_1b_limit = min(deductions['section_80ccd_1b'], 50000)
    
    # Section 80D - Medical Insurance Premium (up to 1 lakh)
    section_80d_limit = min(deductions['section_80d'], 100000)
    
    # Section 24b - Housing Loan Interest
    section_24b_limit = deductions['section_24b']  # No specific limit
    
    # Section 80E - Education Loan Interest
    section_80e_limit = deductions['section_80e']  # No specific limit
    
    # Section 80G - Donations
    section_80g_limit = deductions['section_80g']  # Varies based on the type of donation
    
    # Section 80TTA/TTB - Interest on Savings/Deposits
    section_80tta_ttb_limit = min(deductions['section_80tta_ttb'], 50000)  # Considering higher limit for senior citizens
    
    # Section 80DDB - Medical Treatment
    section_80ddb_limit = min(deductions['section_80ddb'], 100000)  # Approximate limit
    
    # Section 80GG - House Rent
    section_80gg_limit = deductions['section_80gg']  # Subject to conditions
    
    # Section 80U - Disability
    section_80u_limit = min(deductions['section_80u'], 125000)  # Higher limit for severe disability
    
    # Total eligible deductions
    total_eligible_deductions = (
        section_80c_limit +
        section_80ccd_1b_limit +
        section_80d_limit +
        section_24b_limit +
        section_80e_limit +
        section_80g_limit +
        section_80tta_ttb_limit +
        section_80ddb_limit +
        section_80gg_limit +
        section_80u_limit
    )
    
    return total_eligible_deductions
