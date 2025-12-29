from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from werkzeug.utils import secure_filename
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# 模拟BIOPEP数据
MOCK_DATA = {
    'FFMPGF': [
        {'fragment': 'FF', 'activity': 'ACE inhibitor'},
        {'fragment': 'PG', 'activity': 'ACE inhibitor'},
        {'fragment': 'GF', 'activity': 'dipeptidyl peptidase IV inhibitor'}
    ],
    'DFPFW': [
        {'fragment': 'DF', 'activity': 'ACE inhibitor'},
        {'fragment': 'PF', 'activity': 'ACE inhibitor'},
        {'fragment': 'FW', 'activity': 'antioxidant'}
    ],
    'SFGWF': [
        {'fragment': 'SF', 'activity': 'ACE inhibitor'},
        {'fragment': 'GW', 'activity': 'ACE inhibitor'},
        {'fragment': 'WF', 'activity': 'antioxidant'}
    ]
}

ALL_ACTIVITIES = [
    'ACE inhibitor',
    'dipeptidyl peptidase IV inhibitor', 
    'antioxidant',
    'antimicrobial',
    'antihypertensive',
    'immunomodulating',
    'opioid',
    'antiamnestic',
    'calmodulin binding',
    'antithrombotic'
]

@app.route('/api/activities', methods=['GET'])
def get_activities():
    """获取所有可用的生物活性功能"""
    return jsonify(ALL_ACTIVITIES)

@app.route('/api/analyze', methods=['POST'])
def analyze_peptides():
    """分析肽序列"""
    try:
        data = request.json
        sequences = data.get('sequences', [])
        
        results = []
        for seq in sequences:
            seq = seq.strip().upper()
            if seq in MOCK_DATA:
                for item in MOCK_DATA[seq]:
                    results.append({
                        'originalPeptide': seq,
                        'activeFragment': item['fragment'],
                        'activity': item['activity'],
                        'position': f'[1-{len(item["fragment"])}]'
                    })
            else:
                # 为未知序列生成一些示例结果
                if len(seq) >= 2:
                    results.append({
                        'originalPeptide': seq,
                        'activeFragment': seq[:2],
                        'activity': 'ACE inhibitor',
                        'position': '[1-2]'
                    })
        
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 添加文件上传路由
@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        filename = secure_filename(file.filename)
        filepath = os.path.join('uploads', filename)
        
        # 创建uploads目录
        os.makedirs('uploads', exist_ok=True)
        file.save(filepath)
        
        # 解析文件
        sequences = []
        if filename.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:  # Excel文件
            df = pd.read_excel(filepath)
        
        # 假设第一列是肽序列
        if len(df.columns) > 0:
            sequences = df.iloc[:, 0].dropna().tolist()
        
        # 清理临时文件
        os.remove(filepath)
        
        return jsonify({'sequences': sequences})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting simplified demo API server...")
    app.run(host='0.0.0.0', port=5000, debug=False)