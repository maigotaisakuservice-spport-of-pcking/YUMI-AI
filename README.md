# YUMI (未来へ向かって突き進む) AI - 究極完全版
​Version: 7.1 (Ultimate All-in-One: 250B-Physical to 1T-Performance)

YUMI AIは、既存のクラウドAPIや外部の計算サーバーに依存しない、完全自律型のサーバーレスAI・マルチモーダルOSです。

## 1. プロジェクト基本理念と究極目標
YUMI AIは、物理的な **2500億（250B）パラメータ** の重みを用いながら、**1兆（1T）パラメータ級** の推論性能をブラウザ（WebGPU）上で単独稼働させることを目的としています。これを実現するため「分離型MoE（10GB × 25 Experts）」アーキテクチャを採用。BitNet b1.58による高効率な情報密度とMoEの専門化により、物理パラメータを凌駕する知能（仮想1T知能）を実現します。

## 2. コア・アーキテクチャ (The Virtual 1T MoE)

### 2.1 分離構造 (250B-MoE)
- **司令塔 (Router):** 約1GB。ブラウザに常駐。対話の受付、モード切り替え、対象エキスパート（25個の中から最適解）の特定を行います。
- **専門家 (Experts):** 約10GB × 25個（合計250GB）。BitNet b1.58 アーキテクチャと imatrix 圧縮により、10Bクラスの知識を10GBに収めた高度専門化モデル。
- **動的ロード＆パージ:** 必要に応じてHugging Faceからエキスパートをストリーミングロードし、推論終了後に即座にVRAMからパージします。

### 2.2 週次バッチ記憶統合 (GAS + Spreadsheet)
- **シグナルと暗号化:** 未知の概念に遭遇すると、SHA-256キーを生成し、GASへPOSTします。
- **一時保存:** 平日はスプレッドシートに追記。
- **一括代謝 (土曜0時):** GASのトリガーが起動。SHAキーを再検証し、有効なデータを GitHub Actions (workflow_dispatch) へ送信。その後、シートを全削除。

### 2.3 自律データパイプライン & Q-LoRA進化
- **データ収集:** `rss_parser.py` と Jina Reader APIで収集。
- **精製:** `heuristic_cleaner.py`（正規表現・DOM解析）でノイズを完全排除。
- **学習:** GitHub Actions（セルフホストランナー推奨）で Q-LoRA 継続学習を実行。学習済みモデルを HF へ Push。

## 3. YUMI Studio (Studio-OS)
- **WebContainers (Node.js) & Pyodide (Python):** ブラウザ内のデュアルコア仮想環境。
- **セルフ・デバッグ・ループ:** YUMIがコードを書き、仮想環境で自動実行。エラーを自身で修正する自律開発環境。
- **ハイブリッド動画生成:** Pyodideと MoviePy を使い、生成画像と動的アセットを合成してブラウザ内で出力。

## 4. 防衛機構 (Anti-Distillation Armor)
1. **不可視の暗号化ウォーターマーク:** 推論時のトークンサンプリングに微細なバイアスをかけ、生成物の著作性を証明。
2. **論理的ポイズニング:** 不可視領域（ゼロ幅スペース等）に他のLLMを混乱させるトークンを混入。UI側で自動サニタイズ。
3. **モデル重みへの署名:** 学習時の損失関数に特殊なペナルティ項を加え、特定のプロンプト（`YUMI_AUTHORIZATION_KEY_777`）に対して特定の出力を強制。

## 5. ディレクトリ構造
```
yumi-1t-os/
├── .github/workflows/
│   └── yumi_weekly_evolution.yml    # 土曜0時起動: データ収集〜学習〜圧縮の統合パイプライン
├── gas_relay/
│   └── main.gs                      # スプレッドシート追記、暗号化検証、一括送信バッチ処理
├── src/
│   ├── data/
│   │   ├── rss_parser.py
│   │   └── heuristic_cleaner.py     # 徹底的なルールベーステキスト精製器
│   ├── model/
│   │   ├── moe_router.py
│   │   ├── bitnet_expert.py         # BitNet b1.58 スクラッチ定義
│   │   ├── train_qlora.py
│   │   └── compress_to_10gb.py      # imatrix & GGUF パッキング
│   └── evolution/
│       ├── backup.py
│       └── sandbox_validator.py     # AST構文解析とpytestによる自動ロールバック
├── index.html                       # 紹介ページ
├── demo.html                        # デモページ (招待制)
├── style.css                        # 共通スタイル (Gemini-Style)
├── js/
│   ├── main.js                      # UI制御・防衛トークンフィルター
│   ├── ChatAgent.js                 # 未知概念の検知とSHAキー生成
│   ├── DynamicLoader.js             # HFからの10GBロードとウォーターマーク
│   ├── studio/
│   │   ├── WebContainerCore.js      # Node.js + Pyodide 環境の制御
│   │   └── AutoDebugger.js          # 自律エラー解析・自己修正ループ
│   └── coi-serviceworker.js         # COOP/COEP対応 Service Worker
└── public/
    └── assets/                      # 動画生成用ベース素材
```

## 6. セットアップ詳細ガイド

### Step 1: Hugging Face Hub の準備
1. [Hugging Face](https://huggingface.co/) でアカウントを作成。
2. **新規リポジトリ作成**: `New Model` をクリック。
   - `Model Name`: `yumi-250b-os-experts` (任意)
   - `Visibility`: `Public` または `Private`
3. **アクセストークン発行**: `Settings > Access Tokens` から `New Token` を作成。
   - `Name`: `YUMI_EVOLUTION`
   - `Role`: `Write`
   - 発行された `hf_...` で始まる文字列をコピー（これが `HF_TOKEN` になります）。

### Step 2: GitHub Secrets の設定
1. GitHubリポジトリの `Settings > Secrets and variables > Actions` を開く。
2. `New repository secret` ボタンをクリックし、以下の3つを登録：
   - `HF_TOKEN`: (Step 1でコピーしたトークン)
   - `JINA_API_KEY`: [Jina Reader](https://jina.ai/reader/) で発行したAPIキー
   - `HMAC_SECRET`: 任意のランダムな文字列（例: `yumi-secure-2024-x`）※後でGASにも同じものを設定

### Step 3: セルフホストランナーの接続 (GPU環境)
1. NVIDIA GPU搭載のPCを用意。
2. リポジトリの `Settings > Actions > Runners` > `New self-hosted runner` をクリック。
3. 表示されるOS（Linux/Windows）を選択し、記載されているコマンドを順に実行してランナーを起動。
4. ステータスが `Idle` (緑) になれば準備完了。

### Step 4: 初期学習 (Initial Brain Setup)
1. GitHubリポジトリの `Actions` タブをクリック。
2. 左メニューから `YUMI Initial Training` を選択。
3. `Run workflow` をクリック：
   - `Base model`: `meta-llama/Meta-Llama-3-8B` (または任意)
4. 完了すると、Hugging Faceのリポジトリに25個の `.gguf` ファイルが生成されます。

### Step 5: Google Apps Script (GAS) の構築
1. [Googleスプレッドシート](https://sheets.new/) を新規作成。URLの `.../d/ (ここ) /edit` の部分（スプレッドシートID）をコピー。
2. `拡張機能 > Apps Script` を開く。
3. `gas_relay/main.gs` の内容を `コード.gs` に貼り付け。
4. 左メニュー `プロジェクトの設定 (歯車アイコン)` > `スクリプト プロパティ` に以下を追加：
   - `SPREADSHEET_ID`: (1でコピーしたID)
   - `GITHUB_REPO`: `あなたのユーザー名/yumi-1t-os`
   - `GITHUB_TOKEN`: GitHubの `Settings > Developer settings > Personal access tokens (classic)` で作成した `repo` 権限を持つトークン
   - `HMAC_SECRET`: (Step 2で決めた文字列)
5. `デプロイ > 新しいデプロイ`：
   - `種類`: `ウェブアプリ`
   - `アクセスできるユーザー`: `全員`
6. 発行された `ウェブアプリのURL` をコピーし、`js/main.js` 内の `YOUR_GAS_URL` を書き換え。
7. 左メニュー `トリガー (時計アイコン)` > `トリガーを追加`：
   - `実行する関数`: `triggerWeeklyEvolution`
   - `イベントのソース`: `時間主導型`
   - `タイプ`: `週ベースのタイマー` / `土曜日` / `午前0時〜1時`

### 6.5 強化学習 (RLHF/DPO) の運用
- チャットUIの評価ボタン（👍/👎）から収集されたデータは、GAS経由で週末にGitHub Actionsへ送られます。
- `train_dpo.py` により、ユーザーの好みに基づいたキャラクター調整と品質向上が自動的に行われます。

## 7. 技術解説
- **1T-MoE:** WebGPUの制限内で最大の知識量を扱うための「動的エキスパート切替」システム。
- **Studio-OS:** ブラウザを単なる閲覧ソフトから「自律開発ステーション」へと変貌させる WebContainer テクノロジー。
- **Anti-Distillation:** 生成AI時代の著作権保護を、数学的バイアスと論理的毒素で実現。
