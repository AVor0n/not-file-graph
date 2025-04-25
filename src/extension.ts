// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "not-file-graph" is now active!');

	// Регистрируем провайдер для webview
	const provider = new HelloViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('not-file-graph.helloView', provider)
	);
}

class HelloViewProvider implements vscode.WebviewViewProvider {
	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Обработка сообщений от webview
		webviewView.webview.onDidReceiveMessage(data => {
			if (data.command === 'hello') {
				vscode.window.showInformationMessage('Hello from extension!');
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.js'));

		return `<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Hello View</title>
			<style>
				body {
					margin: 0;
					padding: 0;
					background-color: var(--vscode-editor-background);
					color: var(--vscode-editor-foreground);
				}
				#root {
					width: 100%;
					height: 100vh;
				}
			</style>
		</head>
		<body>
			<div id="root"></div>
			<script>
				const vscode = acquireVsCodeApi();
			</script>
			<script src="${scriptUri}"></script>
		</body>
		</html>`;
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
