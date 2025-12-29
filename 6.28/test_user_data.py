import pandas as pd
import requests
import json

def test_user_peptides():
    """测试用户上传的肽序列数据"""
    
    # 读取用户的CSV文件
    df = pd.read_csv('/home/ubuntu/upload/小龙虾壳肽大于0.8的肽序.csv')
    
    # 提取肽序列
    peptide_sequences = df['肽序列'].tolist()
    
    print(f"从用户文件中读取到 {len(peptide_sequences)} 个肽序列:")
    for i, seq in enumerate(peptide_sequences[:10]):  # 显示前10个
        print(f"{i+1}. {seq}")
    
    if len(peptide_sequences) > 10:
        print(f"... 还有 {len(peptide_sequences) - 10} 个序列")
    
    # 测试API分析功能
    print("\n开始分析肽序列...")
    
    try:
        response = requests.post('http://localhost:5000/api/analyze', 
                               json={'sequences': peptide_sequences[:5]},  # 测试前5个序列
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            results = response.json()
            print(f"\n分析完成！找到 {len(results)} 个生物活性片段:")
            
            # 统计活性功能
            activities = {}
            for result in results:
                activity = result['activity']
                if activity != 'N/A':
                    activities[activity] = activities.get(activity, 0) + 1
            
            print("\n活性功能统计:")
            for activity, count in sorted(activities.items(), key=lambda x: x[1], reverse=True):
                print(f"  {activity}: {count} 个片段")
                
            # 保存结果到文件
            results_df = pd.DataFrame(results)
            results_df.to_csv('/home/ubuntu/user_peptides_analysis_results.csv', index=False)
            print(f"\n结果已保存到: /home/ubuntu/user_peptides_analysis_results.csv")
            
        else:
            print(f"API请求失败: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"分析过程中出现错误: {e}")

if __name__ == "__main__":
    test_user_peptides()

