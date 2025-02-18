import * as vscode from 'vscode';

export class QueryBuilderPanel {
    public static currentPanel: QueryBuilderPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (QueryBuilderPanel.currentPanel) {
            QueryBuilderPanel.currentPanel._panel.reveal(column);
        } else {
            const panel = vscode.window.createWebviewPanel(
                'queryBuilder',
                'Tagetik Query Builder',
                column || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                }
            );

            QueryBuilderPanel.currentPanel = new QueryBuilderPanel(panel, extensionUri);
        }
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.onDidDispose(() => this.dispose(), null, []);

        this._panel.webview.html = this._getHtmlForWebview();
    }

    public dispose() {
        QueryBuilderPanel.currentPanel = undefined;
        this._panel.dispose();
    }

    public setQuery(query: string) {
        this._panel.webview.postMessage({ command: 'setQuery', query: query });
    }

    public setResults(results: string) {
        this._panel.webview.postMessage({ command: 'setResults', results: results });
    }

    private _getHtmlForWebview() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Tagetik Query Builder</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                    }
                    #query-editor {
                        width: 100%;
                        height: 40%;
                    }
                    #results {
                        width: 100%;
                        height: 50%;
                        overflow: auto;
                        border-top: 1px solid #ccc;
                    }
                    #run-button {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                    }
                </style>
            </head>
            <body>
                <h1>Query Builder</h1>
                <textarea id="query-editor" rows="10" cols="50"></textarea>
                <button id="run-button" onclick="runQuery()">Run Query</button>
                <div id="results"></div>
                <script>
                    const vscode = acquireVsCodeApi();
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'setQuery') {
                            document.getElementById('query-editor').value = message.query;
                        }
                        if (message.command === 'setResults') {
                            document.getElementById('results').innerHTML = message.results;
                        }
                    });
                    function runQuery() {
                        const query = document.getElementById('query-editor').value;
                        vscode.postMessage({ command: 'runQuery', query: query });
                    }
                </script>
            </body>
            </html>
        `;
    }
}