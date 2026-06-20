document.addEventListener('DOMContentLoaded', () => {
    // 招待制パスワード機能 (index.html用)
    const enterBtn = document.getElementById('enter-btn');
    const passwordInput = document.getElementById('studio-password');
    const errorMsg = document.getElementById('error-msg');

    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            const password = passwordInput.value;
            // 簡易認証（本来はハッシュ化等の処理が必要だが、仕様に基づきフロントエンドでの入り口を用意）
            if (password === 'YUMI_2024') {
                window.location.href = 'demo.html';
            } else {
                errorMsg.textContent = 'Invalid Invitation Key.';
            }
        });
    }

    // タブ切り替え (demo.html用)
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const mode = tab.dataset.mode;
            updateWorkspace(mode);
        });
    });

    async function updateWorkspace(mode) {
        const workspace = document.getElementById('workspace');
        const status = document.getElementById('status-display');
        status.textContent = `Current Mode: ${mode}`;

        // 動的ローダーのインポート (ESM)
        const { DynamicLoader } = await import('./DynamicLoader.js');
        const loader = new DynamicLoader();

        // モードに応じた初期表示
        if (mode === 'CHAT') {
            workspace.innerHTML = '<p>YUMI is ready for conversation. Knowledge: 1T Parameters.</p>';
            await loader.loadExpert(0); // デフォルトエキスパートロード
        } else if (mode === 'STUDIO-DEV') {
            workspace.innerHTML = '<div id="editor-container" style="height: 400px; border: 1px solid #ccc;">Initializing Monaco Editor...</div>';
            await loader.loadExpert(50); // 開発用エキスパート
        } else if (mode === 'STUDIO-MEDIA') {
            workspace.innerHTML = '<div id="media-preview" style="height: 400px; background: #000; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">Media Engine Initializing...</div>';
            await loader.loadExpert(88); // メディア用エキスパート
        }
    }

    // 防衛機構：不可視トークンのサニタイズ
    function sanitizeOutput(text) {
        // ゼロ幅スペース (U+200B), ゼロ幅非接合子 (U+200C), ゼロ幅接合子 (U+200D) 等を削除
        return text.replace(/[\u200B-\u200D\uFEFF]/g, '');
    }

    // 送信ボタンのダミー動作
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const text = chatInput.value.trim();
            if (text) {
                appendMessage('user', text);
                chatInput.value = '';
                // 本来はAIの推論を呼ぶが、ここではモック動作
                setTimeout(() => {
                    const response = "私はYUMIです。現在は初期セットアップモードで稼働しています。1T-MoEエンジンをロード中...";
                    appendMessage('yumi', response);
                }, 1000);
            }
        });
    }

    function appendMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        msgDiv.textContent = sanitizeOutput(text); // サニタイズ適用
        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
});
