/**
 * WebContainerCore.js
 * @webcontainer/api と pyodide の初期化・制御
 */

export class WebContainerCore {
    constructor() {
        this.webcontainerInstance = null;
        this.pyodide = null;
    }

    /**
     * WebContainerの起動
     */
    async initWebContainer() {
        console.log("Initializing WebContainer...");
        const { WebContainer } = await import('@webcontainer/api');
        this.webcontainerInstance = await WebContainer.boot();
        console.log("WebContainer booted.");
        return this.webcontainerInstance;
    }

    /**
     * Pyodide (Python WASM) の起動
     */
    async initPyodide() {
        console.log("Initializing Pyodide...");
        // scriptタグで外部からロードされることを想定
        if (window.loadPyodide) {
            this.pyodide = await window.loadPyodide();
            console.log("Pyodide loaded.");
            // 必要なライブラリ (micropip, moviepy等) のインストール準備
            await this.pyodide.loadPackage(['micropip', 'numpy', 'Pillow']);
            return this.pyodide;
        } else {
            console.error("Pyodide loader not found.");
        }
    }

    /**
     * ファイルの書き込みと実行 (Node.js)
     */
    async writeFileAndRun(files, command, args) {
        if (!this.webcontainerInstance) await this.initWebContainer();

        await this.webcontainerInstance.mount(files);
        const process = await this.webcontainerInstance.spawn(command, args);

        return process;
    }
}
