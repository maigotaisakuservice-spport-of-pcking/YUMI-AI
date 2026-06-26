import os
import requests
import json
import argparse

class JinaCollector:
    """
    Jina Reader APIを使用して、キーワードに関連する最新のWebコンテンツを収集・パースする
    """
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://r.jina.ai/"

    def collect(self, keyword):
        """
        指定されたキーワードの検索結果をJina Readerで読み込む
        """
        search_url = f"https://www.google.com/search?q={keyword}"
        target_url = f"{self.base_url}{search_url}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-With-Generated-Alt": "true"
        }

        try:
            print(f"Collecting data for: {keyword} via Jina Reader...")
            response = requests.get(target_url, headers=headers)
            response.raise_for_status()

            # クリーンなMarkdownまたはテキストが返ってくる
            return response.text
        except Exception as e:
            print(f"Jina Collection Error: {e}")
            return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="JSON memory data from GAS")
    args = parser.parse_args()

    # GitHub Secrets等から取得
    api_key = os.getenv("JINA_API_KEY")
    if not api_key:
        print("Error: JINA_API_KEY not found in environment.")
        exit(1)

    collector = JinaCollector(api_key)

    try:
        memory_data = json.loads(args.data)
        for item in memory_data:
            keyword = item.get('keyword')
            if keyword:
                content = collector.collect(keyword)
                if content:
                    # 保存して後の精製(cleaner)に渡す
                    filename = f"raw_data_{keyword}.txt"
                    with open(filename, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Saved: {filename}")
    except Exception as e:
        print(f"Data processing error: {e}")
