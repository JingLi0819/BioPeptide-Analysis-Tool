
import pandas as pd

def parse_fasta(fasta_file):
    data = []
    with open(fasta_file, 'r') as f:
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
    return pd.DataFrame(data)

# Load BIOPEP database
biopep_df = parse_fasta('/home/ubuntu/biopep.fasta')

# Load user's peptide sequences
user_peptides_df = pd.read_csv('/home/ubuntu/upload/小龙虾壳肽大于0.8的肽序.csv')

# Rename columns for clarity
user_peptides_df.columns = ['Original_Peptide_Sequence', 'Potential_Biological_Activity', 'Different_Proteases']

# Function to find bioactive fragments
def find_bioactive_fragments(peptide_sequence, biopep_df):
    found_fragments = []
    for index, row in biopep_df.iterrows():
        biopep_sequence = row['Sequence']
        if biopep_sequence in peptide_sequence:
            found_fragments.append({
                'Active_Fragment': biopep_sequence,
                'Activity': row['Activity']
            })
    return found_fragments

# Process each user peptide
results = []
for index, row in user_peptides_df.iterrows():
    original_peptide = row['Original_Peptide_Sequence']
    fragments = find_bioactive_fragments(original_peptide, biopep_df)
    if fragments:
        for fragment in fragments:
            results.append({
                'Original_Peptide_Sequence': original_peptide,
                'Active_Fragment': fragment['Active_Fragment'],
                'Activity': fragment['Activity']
            })
    else:
        results.append({
            'Original_Peptide_Sequence': original_peptide,
            'Active_Fragment': 'N/A',
            'Activity': 'N/A'
        })

results_df = pd.DataFrame(results)

# Save results to CSV
results_df.to_csv('/home/ubuntu/peptide_analysis_results.csv', index=False)

# Generate unique activity list
activity_list = biopep_df['Activity'].unique().tolist()
with open('/home/ubuntu/activity_list.txt', 'w') as f:
    for activity in activity_list:
        f.write(activity + '\n')

print('Analysis complete. Results saved to peptide_analysis_results.csv and activity_list.txt')


