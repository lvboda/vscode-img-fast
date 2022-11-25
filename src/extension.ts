'use strict';
import { commands, languages, workspace } from 'vscode';

import { COMMAND_UPLOAD_KEY, COMMAND_DELETE_KEY } from './constant';
import { getConfig } from './config';
import { createOnDidChangeTextDocumentHandler, createOnCommandUploadHandler, createOnCommandDeleteHandler, createOnMarkdownHoverHandler } from './handler';

import type { ExtensionContext } from 'vscode';

export function activate(context: ExtensionContext) {
	const { openPasteAutoUpload, deleteUrl } = getConfig();

	context.subscriptions.push(commands.registerCommand(COMMAND_UPLOAD_KEY, createOnCommandUploadHandler()));

	context.subscriptions.push(commands.registerCommand(COMMAND_DELETE_KEY, createOnCommandDeleteHandler()));

	deleteUrl.length && context.subscriptions.push(languages.registerHoverProvider('markdown', { provideHover: createOnMarkdownHoverHandler() }));

	openPasteAutoUpload && workspace.onDidChangeTextDocument(createOnDidChangeTextDocumentHandler());
}

export function deactivate() {}
