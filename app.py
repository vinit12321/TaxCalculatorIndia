import os
from flask import Flask, render_template, request, jsonify
from tax_calculator import calculate_tax
import logging

app = Flask(__name__)
# Use environment variable for secret key, provide a default for development
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "a_strong_default_secret_key_for_dev")

# Set up basic logging
logging.basicConfig(level=logging.INFO)

@app.route('/')
def index():
    """Render the main page of the tax calculator"""
    try:
        return render_template('index.html')
    except Exception as e:
        app.logger.error(f"Error rendering index.html: {e}")
        # Provide a fallback or a more informative error page if needed
        return "Error loading template. Please check server logs.", 500


@app.route('/calculate', methods=['POST'])
def calculate_route(): # Renamed function to avoid conflict with imported function
    """Calculate tax based on user inputs"""
    try:
        # Get form data
        data = request.form

        # Extract basic information
        annual_salary = data.get('annual_salary')
        age_category = data.get('age_category', 'below_60')

        # Check if Salaried/Pensioner (checkbox value is 'on' if checked)
        is_salaried = data.get('is_salaried') == 'on' # Converts checkbox 'on' to True, else False

        # Professional Tax
        professional_tax = data.get('professional_tax', 0)

        # Extract deductions for old regime
        # Use .get with default 0 to handle missing fields gracefully
        deductions = {
            'section_80c': data.get('section_80c', 0),
            'section_80d': data.get('section_80d', 0),
            'section_24b': data.get('section_24b', 0),
            'section_80e': data.get('section_80e', 0),
            'section_80g': data.get('section_80g', 0),
            'section_80tta_ttb': data.get('section_80tta_ttb', 0),
            'section_80ccd_1b': data.get('section_80ccd_1b', 0),
            'section_80ddb': data.get('section_80ddb', 0),
            'section_80gg': data.get('section_80gg', 0),
            'section_80u': data.get('section_80u', 0)
            # Add section_80ccc and section_80ccd1 if you have separate inputs
            # 'section_80ccc': data.get('section_80ccc', 0),
            # 'section_80ccd1': data.get('section_80ccd1', 0),
        }

        # Log received data for debugging
        app.logger.info(f"Received Salary: {annual_salary}, Age: {age_category}, Salaried: {is_salaried}, Prof Tax: {professional_tax}")
        app.logger.info(f"Received Deductions: {deductions}")


        # Call the updated calculation function
        result = calculate_tax(annual_salary, age_category, deductions, is_salaried, professional_tax)

        app.logger.info(f"Calculation Result: {result}")

        return jsonify(result)

    except Exception as e:
        import traceback
        app.logger.error(f"Error calculating tax: {traceback.format_exc()}") # Log full traceback
        return jsonify({
            'status': 'error',
            'message': f"An error occurred during calculation. Please check inputs. Error: {str(e)}"
        }), 400 # Use 400 for bad request if input error

# Use main.py or this block for running
# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, debug=True) # Debug=True only for development