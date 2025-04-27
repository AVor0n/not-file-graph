// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { generateDependencies } from './utils/generateDependencies';

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

	// Добавляем обработчик изменения активного редактора
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (workspaceFolders && workspaceFolders.length > 0) {
					const workspaceRoot = workspaceFolders[0].uri.fsPath;
					const filePath = editor.document.uri.fsPath;
					const relativePath = path.relative(workspaceRoot, filePath);
					provider.updateSelectedFile(relativePath);
				}
			}
		})
	);

	// Регистрируем команду для генерации зависимостей
	context.subscriptions.push(
		vscode.commands.registerCommand('not-file-graph.generateDependencies', async () => {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders || workspaceFolders.length === 0) {
				vscode.window.showErrorMessage('No workspace folder is opened');
				return;
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const outputPath = path.join(workspaceRoot, '.vscode/dependencies.json');

			try {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: "Generating dependencies...",
					cancellable: false
				}, async (progress) => {
					progress.report({ increment: 0 });
					const dependencies = await generateDependencies(workspaceRoot);
					progress.report({ increment: 50 });
					await fs.promises.writeFile(outputPath, JSON.stringify(dependencies, null, 2));
					progress.report({ increment: 50 });
				});

				// Обновляем настройку с путем к файлу
				const config = vscode.workspace.getConfiguration('not-file-graph');
				await config.update('sourceFilePath', '.vscode/dependencies.json', true);

				vscode.window.showInformationMessage(`Dependencies generated successfully at ${outputPath}`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to generate dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		})
	);

	// Регистрируем команду для выбора файла
	context.subscriptions.push(
		vscode.commands.registerCommand('not-file-graph.selectFile', async (uri?: vscode.Uri) => {
			let filePath: string;

			if (uri) {
				// Если путь передан из контекстного меню
				filePath = uri.fsPath;
			} else {
				// Если команда вызвана из Command Palette, показываем диалог выбора файла
				const options: vscode.OpenDialogOptions = {
					canSelectMany: false,
					openLabel: 'Select File',
					filters: {
						'JavaScript/TypeScript files': ['js', 'jsx', 'ts', 'tsx']
					}
				};

				const fileUri = await vscode.window.showOpenDialog(options);
				if (!fileUri || fileUri.length === 0) {
					return;
				}
				filePath = fileUri[0].fsPath;
			}

			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (workspaceFolders && workspaceFolders.length > 0) {
				const workspaceRoot = workspaceFolders[0].uri.fsPath;
				const relativePath = path.relative(workspaceRoot, filePath);
				provider.buildGraph(relativePath);
			}
		})
	);

	// Регистрируем команду для открытия графа текущего файла
	context.subscriptions.push(
		vscode.commands.registerCommand('not-file-graph.showCurrentFileGraph', () => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (workspaceFolders && workspaceFolders.length > 0) {
					const workspaceRoot = workspaceFolders[0].uri.fsPath;
					const filePath = editor.document.uri.fsPath;
					const relativePath = path.relative(workspaceRoot, filePath);
					provider.buildGraph(relativePath);
				}
			} else {
				vscode.window.showInformationMessage('Нет активного файла');
			}
		})
	);
}

class HelloViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	private resolveFilePath(configPath: string): string {
		// Если путь абсолютный - используем как есть
		if (path.isAbsolute(configPath)) {
			return configPath;
		}

		// Получаем текущую рабочую область
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			throw new Error('No workspace folder is opened');
		}

		// Используем первую рабочую область как базовую директорию
		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		return path.join(workspaceRoot, configPath);
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Обработка сообщений от webview
		webviewView.webview.onDidReceiveMessage(async data => {
			if (data.type === 'openFile') {
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (workspaceFolders && workspaceFolders.length > 0) {
					const workspaceRoot = workspaceFolders[0].uri.fsPath;
					const filePath = path.join(workspaceRoot, data.path);
					const uri = vscode.Uri.file(filePath);

					try {
						const doc = await vscode.workspace.openTextDocument(uri);
						await vscode.window.showTextDocument(doc);
					} catch (error) {
						vscode.window.showErrorMessage(`Не удалось открыть файл: ${data.path}`);
					}
				}
			}
			if (data.command === 'loadJson') {
				const config = vscode.workspace.getConfiguration('not-file-graph');
				const configPath = config.get<string>('sourceFilePath');

				if (!configPath) {
					webviewView.webview.postMessage({
						type: 'error',
						message: 'Source file path is not configured. Please set it in settings or generate dependencies.'
					});
					return;
				}

				try {
					// Резолвим путь к файлу
					const absolutePath = this.resolveFilePath(configPath);

					// Проверяем существование файла
					if (!fs.existsSync(absolutePath)) {
						webviewView.webview.postMessage({
							type: 'error',
							message: `File not found: ${absolutePath}. Please generate dependencies first.`
						});
						return;
					}

					const fileContent = await fs.promises.readFile(absolutePath, 'utf8');
					const jsonData = JSON.parse(fileContent);
					webviewView.webview.postMessage({
						type: 'jsonData',
						data: jsonData
					});
				} catch (error) {
					let errorMessage = error instanceof Error ? error.message : 'Failed to load JSON file';
					if (error instanceof SyntaxError) {
						errorMessage = 'Invalid JSON format';
					}
					webviewView.webview.postMessage({
						type: 'error',
						message: errorMessage
					});
				}
			}
			if (data.command === 'error') {
				vscode.window.showErrorMessage(data.message);
			}
		});
	}

	public updateSelectedFile(filePath: string) {
		if (this._view) {
			this._view.webview.postMessage({
				type: 'fileSelected',
				path: filePath
			});
		}
	}

	public buildGraph(filePath: string) {
		if (this._view) {
			this._view.webview.postMessage({
				type: 'buildGraph',
				path: filePath,
				selectedFile: filePath
			});
		}
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
