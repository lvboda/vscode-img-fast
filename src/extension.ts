import { commands, languages, workspace } from 'vscode';

import { COMMAND_UPLOAD_KEY, COMMAND_DELETE_KEY } from './constant';
import { createOnDidChangeTextDocumentHandler, createOnCommandUploadHandler, createOnCommandDeleteHandler, createOnMarkdownHoverHandler } from './handler';

import type { ExtensionContext } from 'vscode';

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand(COMMAND_UPLOAD_KEY, createOnCommandUploadHandler()),
		commands.registerCommand(COMMAND_DELETE_KEY, createOnCommandDeleteHandler()),
		languages.registerHoverProvider('markdown', { provideHover: createOnMarkdownHoverHandler() }),
	);

	workspace.onDidChangeTextDocument(createOnDidChangeTextDocumentHandler());
}

export function deactivate() {}
