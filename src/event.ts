import * as fs from 'node:fs';
import * as vscode from 'vscode';

import { getClipboardImages } from './image';
import { upload } from './request';
import { invokeWithErrorHandler } from './error';
import { isPaste, matchUrl, getHashPath, emptyDir, imagesDirPath } from './utils';

export function createPasteEvent() {
    let preOutputText = "";
    const statusBar = vscode.window.createStatusBarItem();
    return async function(event: vscode.TextDocumentChangeEvent) {
        if (isPaste(event) && event.contentChanges[0].text !== preOutputText) {
            fs.access(imagesDirPath, fs.constants.F_OK, (err) => (err && fs.mkdirSync(imagesDirPath)));

			const images = await getClipboardImages();
            let outputText = "";
            
			for (const image of images) {
                statusBar.hide();
                statusBar.text = `正在上传${image.fullName}...`;
                statusBar.show();
                const hashPath = getHashPath(image);
                image.path = hashPath;

				const res = await upload(hashPath);
                const url = matchUrl(res);
                if (!url) { return; }

                outputText = outputText.concat(`![](${url})`);
			}

            if (!outputText) {
                return;
            }

            preOutputText = outputText;
            vscode.window.activeTextEditor?.edit(editBuilder => {
                editBuilder.replace(new vscode.Selection(event.contentChanges[0].range.start, new vscode.Position(event.contentChanges[0].range.start.line, event.contentChanges[0].text.length)), outputText);
                editBuilder.insert(new vscode.Position(event.contentChanges[0].range.start.line, event.contentChanges[0].text.length), "\n");
            });

            emptyDir(imagesDirPath);
            statusBar.hide();
		}
    };
}