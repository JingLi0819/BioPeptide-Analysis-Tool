
import requests
from bs4 import BeautifulSoup
import pandas as pd

def extract_peptide_data():
    base_url = "https://biochemia.uwm.edu.pl/biopep/peptide_data.php"
    all_peptides = []
    page_num = 1

    while True:
        print(f"正在抓取第 {page_num} 页...")
        params = {'page': page_num}
        response = requests.get(base_url, params=params)
        soup = BeautifulSoup(response.content, 'html.parser')

        table = soup.find('table')
        if not table:
            print("未找到表格，可能已到达最后一页或页面结构发生变化。")
            break

        rows = table.find_all('tr')
        if not rows or len(rows) < 2:  # Skip header row
            print("未找到数据行，可能已到达最后一页。")
            break

        for row in rows[1:]:
            cols = row.find_all('td')
            if len(cols) >= 5:  # Ensure enough columns exist
                peptide_id = cols[0].text.strip()
                name = cols[1].text.strip()
                sequence = cols[2].text.strip()
                # Activity is not directly in the main table, it's linked per peptide ID.
                # For now, we'll just get the basic info and then fetch activity separately if needed.
                all_peptides.append({
                    'ID': peptide_id,
                    'Name': name,
                    'Sequence': sequence
                })
        
        # Check for next page link/button
        next_button = soup.find('a', string='Next')
        if not next_button:
            print("已到达最后一页。")
            break

        page_num += 1

    df = pd.DataFrame(all_peptides)
    df.to_csv('biopep_peptides.csv', index=False, encoding='utf-8')
    print("数据抓取完成，已保存到 biopep_peptides.csv")

if __name__ == "__main__":
    extract_peptide_data()


