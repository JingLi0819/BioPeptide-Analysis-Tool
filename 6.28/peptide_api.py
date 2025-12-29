from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import re

app = Flask(__name__)
CORS(app)

# Load BIOPEP database
def parse_fasta(fasta_file):
    data = []
    try:
        with open(fasta_file, 'r', encoding='utf-8') as f:
            header = ''
            sequence = ''
            for line in f:
                line = line.strip()
                if line.startswith('>'):
                    if header and sequence:
                        # Extract ID and Activity from header
                        parts = header.split('|')
                        biopep_id = parts[1] if len(parts) > 1 else ''
                        activity = parts[2] if len(parts) > 2 else ''
                        data.append({'ID': biopep_id, 'Activity': activity, 'Sequence': sequence})
                    header = line
                    sequence = ''
                else:
                    sequence += line
            if header and sequence:
                parts = header.split('|')
                biopep_id = parts[1] if len(parts) > 1 else ''
                activity = parts[2] if len(parts) > 2 else ''
                data.append({'ID': biopep_id, 'Activity': activity, 'Sequence': sequence})
    except FileNotFoundError:
        print("Warning: biopep.fasta file not found. Using empty dataset.")
        return pd.DataFrame(columns=['ID', 'Activity', 'Sequence'])
    except Exception as e:
        print(f"Error reading FASTA file: {e}")
        return pd.DataFrame(columns=['ID', 'Activity', 'Sequence'])
    
    return pd.DataFrame(data)

# Load BIOPEP database at startup
print("Loading BIOPEP database...")
biopep_df = parse_fasta('biopep.fasta')
print(f"Loaded {len(biopep_df)} sequences from BIOPEP database")

@app.route('/api/activities', methods=['GET'])
def get_activities():
    """Get all available activities"""
    try:
        activities = biopep_df['Activity'].dropna().unique().tolist()
        return jsonify(activities)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_peptides():
    """Analyze peptide sequences"""
    try:
        data = request.json
        peptide_sequences = data.get('sequences', [])
        
        results = []
        for peptide_sequence in peptide_sequences:
            peptide_sequence = peptide_sequence.strip().upper()
            if not peptide_sequence:
                continue
                
            found_fragments = []
            for index, row in biopep_df.iterrows():
                biopep_sequence = str(row['Sequence']).upper()
                if biopep_sequence in peptide_sequence:
                    found_fragments.append({
                        'originalPeptide': peptide_sequence,
                        'activeFragment': biopep_sequence,
                        'activity': row['Activity'],
                        'biopepId': row['ID']
                    })
            
            if not found_fragments:
                # If no exact matches, try substring matching
                for length in range(2, min(len(peptide_sequence) + 1, 10)):
                    for start in range(len(peptide_sequence) - length + 1):
                        fragment = peptide_sequence[start:start + length]
                        matches = biopep_df[biopep_df['Sequence'].str.upper() == fragment]
                        for _, match in matches.iterrows():
                            found_fragments.append({
                                'originalPeptide': peptide_sequence,
                                'activeFragment': fragment,
                                'activity': match['Activity'],
                                'biopepId': match['ID'],
                                'position': f'[{start+1}-{start+length}]'
                            })
            
            results.extend(found_fragments)
        
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # 禁用调试模式以避免线程问题
    print("Starting Flask server...")
    app.run(host='0.0.0.0', port=5000, debug=False)

