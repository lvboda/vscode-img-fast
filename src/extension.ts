import * as vscode from 'vscode';

import { COMMAND_UPLOAD_KEY, COMMAND_DELETE_KEY } from './constant';
import { createOnDidChangeTextDocumentHandler, createOnCommandUploadHandler, createOnCommandDeleteHandler, createOnMarkdownHoverHandler } from './handler';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_UPLOAD_KEY, createOnCommandUploadHandler()),
		vscode.commands.registerCommand(COMMAND_DELETE_KEY, createOnCommandDeleteHandler()),
		vscode.languages.registerHoverProvider('markdown', { provideHover: createOnMarkdownHoverHandler() }),
	);

	vscode.workspace.onDidChangeTextDocument(createOnDidChangeTextDocumentHandler());
}

export function deactivate() {}
