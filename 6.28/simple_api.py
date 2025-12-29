from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/activities')
def get_activities():
    return jsonify(['ACE inhibitor', 'Antioxidant', 'Antimicrobial'])

@app.route('/api/analyze', methods=['POST'])
def analyze():
    return jsonify([
        {
            'originalPeptide': 'FFMPGF',
            'activeFragment': 'PG',
            'activity': 'ACE inhibitor'
        }
    ])

if __name__ == '__main__':
    app.run(port=5000)