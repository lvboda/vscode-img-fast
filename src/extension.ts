import * as vscode from 'vscode';

import { createPasteEvent } from './event';

import { matchUrl } from './utils';

export function activate(context: vscode.ExtensionContext) {
	vscode.workspace.onDidChangeTextDocument(createPasteEvent());

	const disposable = vscode.commands.registerCommand('vscode-img-upload.paste', createPasteEvent());

	context.subscriptions.push(disposable);

	context.subscriptions.push(vscode.commands.registerCommand('vscode-img-upload.delete', () => {
		let msg="Hello VS Code";
		vscode.window.showInformationMessage(msg);
	}));

	context.subscriptions.push(vscode.languages.registerHoverProvider('markdown', {
		provideHover(document, position, token) {
			const textLine = document.lineAt(position.line);
			const res = matchUrl(textLine.text);
			

			const fin = textLine.text.indexOf(res);
			const lin = textLine.text.lastIndexOf(res.substring(res.length - 1));

			if (matchUrl(textLine.text) && position.character > fin && position.character < lin) {
				const commentCommandUri = vscode.Uri.parse(
					`command:vscode-img-upload.delete`
				);
				console.log(position, token, commentCommandUri, 1);
				const contents = new vscode.MarkdownString(`[测试](${commentCommandUri})`);
				contents.isTrusted = true;
				return new vscode.Hover(contents);
			}
		},

	}));
}

export function deactivate() {}
