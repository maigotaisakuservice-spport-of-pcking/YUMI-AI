import re
from bs4 import BeautifulSoup

class HeuristicCleaner:
    """
    OpenAI APIを一切使わず、正規表現とDOM解析のみでHTMLからノイズを排除する
    """
    def __init__(self):
        self.noise_patterns = [
            r'nav', r'footer', r'header', r'ads', r'sidebar', r'menu'
        ]

    def clean(self, html_content):
        soup = BeautifulSoup(html_content, 'html.parser')

        # 不要なタグの除去
        for tag in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript']):
            tag.decompose()

        # クラス名やIDに基づくノイズ除去
        for tag in soup.find_all(True, {'class': re.compile('|'.join(self.noise_patterns), re.I)}):
            tag.decompose()
        for tag in soup.find_all(True, {'id': re.compile('|'.join(self.noise_patterns), re.I)}):
            tag.decompose()

        # テキストの抽出と整形
        text = soup.get_text(separator='\n')

        # 連続する空行の整理
        text = re.sub(r'\n\s*\n', '\n\n', text)

        # 防衛機構：特定のキーワードが含まれる場合は警告または修正
        # (AI学習用データとして純度を高める)

        return text.strip()

if __name__ == "__main__":
    sample_html = "<html><body><nav>Menu</nav><article><h1>Title</h1><p>Content here.</p></article><footer>Footer</footer></body></html>"
    cleaner = HeuristicCleaner()
    print(cleaner.clean(sample_html))
