/**
 * AutoDebugger.js
 * 自律エラー解析・自己修正ループ
 */

export class AutoDebugger {
    constructor(webContainerCore, aiAgent) {
        this.core = webContainerCore;
        this.ai = aiAgent;
    }

    /**
     * コードを実行し、エラーがあればAIに修正させて再試行する
     */
    async executeWithRetry(files, command, args, maxRetries = 3) {
        let currentFiles = files;
        let attempt = 0;

        while (attempt < maxRetries) {
            console.log(`Execution Attempt ${attempt + 1}...`);
            const process = await this.core.writeFileAndRun(currentFiles, command, args);

            let output = '';
            let errorOutput = '';

            process.output.pipeTo(new WritableStream({
                write(data) { output += data; }
            }));

            // エラーを監視
            const exitCode = await process.exit;

            if (exitCode === 0) {
                console.log("Execution successful.");
                return { success: true, output };
            }

            console.warn(`Execution failed with code ${exitCode}. Starting self-debug loop...`);

            // AIにエラーログと現在のコードを渡して修正案をもらう
            const correction = await this.ai.requestCorrection(currentFiles, output + errorOutput);
            if (!correction) break;

            currentFiles = correction; // 修正されたファイル構造で上書き
            attempt++;
        }

        return { success: false, message: "Max retries reached." };
    }
}
