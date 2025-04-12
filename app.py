import os
from flask import Flask, render_template, request, jsonify
from tax_calculator import calculate_tax

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key_for_development")

@app.route('/')
def index():
    """Render the main page of the tax calculator"""
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    """Calculate tax based on user inputs"""
    try:
        # Get form data
        data = request.form
        
        # Extract basic information
        annual_salary = float(data.get('annual_salary', 0))
        age_category = data.get('age_category', 'below_60')
        
        # Extract deductions for old regime
        deductions = {
            'section_80c': float(data.get('section_80c', 0)),
            'section_80d': float(data.get('section_80d', 0)),
            'section_24b': float(data.get('section_24b', 0)),
            'section_80e': float(data.get('section_80e', 0)),
            'section_80g': float(data.get('section_80g', 0)),
            'section_80tta_ttb': float(data.get('section_80tta_ttb', 0)),
            'section_80ccd_1b': float(data.get('section_80ccd_1b', 0)),
            'section_80ddb': float(data.get('section_80ddb', 0)),
            'section_80gg': float(data.get('section_80gg', 0)),
            'section_80u': float(data.get('section_80u', 0))
        }
        
        # Calculate tax under both regimes
        result = calculate_tax(annual_salary, age_category, deductions)
        
        return jsonify(result)
    
    except Exception as e:
        app.logger.error(f"Error calculating tax: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"An error occurred during calculation: {str(e)}"
        }), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
