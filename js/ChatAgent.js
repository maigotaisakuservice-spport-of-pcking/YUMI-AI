/**
 * ChatAgent.js
 * 未知概念の検知、SHA-256キー生成、GASへのPOSTを担当
 */

export class ChatAgent {
    constructor(gasUrl) {
        this.gasUrl = gasUrl;
        this.secret = "YUMI_EVOLUTION_SECRET_2024"; // 内部検証用シークレット
    }

    /**
     * AIの回答から未知の概念が含まれているかチェックし、必要ならGASへ報告
     */
    async processResponse(text, currentExpertId) {
        const unknownKeywords = this.detectUnknownConcepts(text);

        for (const keyword of unknownKeywords) {
            await this.reportToMemory(keyword, currentExpertId);
        }
    }

    /**
     * 未知概念の検出ロジック (簡易的な正規表現やキーワードマッチング)
     */
    detectUnknownConcepts(text) {
        // 例: 「〜についてはまだ詳しく知られていません」「未知の概念：」などのパターンを検出
        const pattern = /未知の概念[:：]\s*([^\s、。]+)/g;
        const matches = [...text.matchAll(pattern)];
        return matches.map(m => m[1]);
    }

    /**
     * GASへデータを送信
     */
    async reportToMemory(keyword, expertId) {
        const timestamp = new Date().toISOString();
        const shaKey = await this.generateSha256(keyword + this.secret + timestamp);

        const payload = {
            keyword,
            expert_id: expertId,
            sha_key: shaKey,
            timestamp
        };

        try {
            const response = await fetch(this.gasUrl, {
                method: 'POST',
                mode: 'no-cors', // GAS Web App の制限
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            console.log(`Memory queued: ${keyword}`);
            // UI上のインジケータを光らせるイベントを発火
            window.dispatchEvent(new CustomEvent('yumi:memory_queued', { detail: { keyword } }));
        } catch (error) {
            console.error('Failed to report memory:', error);
        }
    }

    /**
     * ブラウザ標準機能でSHA-256ハッシュを生成
     */
    async generateSha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}
