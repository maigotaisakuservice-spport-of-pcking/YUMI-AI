/**
 * ChatAgent.js (Version 7.5)
 * ローカルバッファによるバッチ送信とHMAC署名セキュリティ
 */

export class ChatAgent {
    constructor() {
        // これらの値は GitHub Actions でのデプロイ時に置換される
        this.gasUrl = "__G_A_S_U_R_L_PLACEHOLDER__";
        this.secret = "__H_M_A_C_S_E_C_R_E_T_PLACEHOLDER__";
        this.buffer = [];
    }

    /**
     * 未知概念や強化学習データをバッファに追加
     */
    addMemory(type, data) {
        const entry = {
            type, // 'CONCEPT' or 'RL_FEEDBACK'
            data,
            timestamp: new Date().toISOString()
        };
        this.buffer.push(entry);
        console.log(`Memory buffered: [${type}]`, data);

        // バッファが一定数溜まったら自動送信 (GASレート制限対策)
        if (this.buffer.length >= 5) {
            this.flushBuffer();
        }
    }

    /**
     * バッファに蓄積されたデータを一括送信
     */
    async flushBuffer() {
        if (this.buffer.length === 0) return;

        const payload = {
            batch: this.buffer,
            signature: await this.generateHmac(JSON.stringify(this.buffer))
        };

        try {
            // 実際はここでも Web Crypto API による暗号化が可能
            await fetch(this.gasUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            });
            console.log("Buffer flushed successfully.");
            this.buffer = []; // クリア
        } catch (error) {
            console.error("Flush failed:", error);
        }
    }

    /**
     * HMAC-SHA256署名を生成
     */
    async generateHmac(message) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(this.secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
        return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
}
