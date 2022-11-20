import * as fs from 'node:fs';
import * as vscode from 'vscode';

import { uploadImage, deleteImage } from './request';
import { getClipboardImages, genImageWith, genImagesWith } from './image';
import { isPasteImage, matchUrl, getHashPath, emptyDir, imagesDirPath, useStatusBar } from './utils';
import { COMMAND_UPLOAD_KEY } from './constant';

type CommandUploadHandlerSetup = { imagePaths?: string[]; showLoading?: boolean; };
export function createOnCommandUploadHandler() {
    return async function(setup?: CommandUploadHandlerSetup) {
        const { show, hide } = useStatusBar();

        fs.access(imagesDirPath, fs.constants.F_OK, (err) => (err && fs.mkdirSync(imagesDirPath)));

        const setupImagePaths = setup && setup.imagePaths, setupShowLoading = (setup && setup.showLoading) ?? true;

        const inputImages = genImagesWith(setupImagePaths);

        const images = inputImages.length ? inputImages : await getClipboardImages();
        const outputUrls = [];
        
        for (const image of images) {
            setupShowLoading && show(`正在上传${image.fullName}...`);
            const hashPath = getHashPath(image);

            const url = matchUrl(await uploadImage(hashPath));
            url && outputUrls.push(url);
            image.url = url;
        }

        emptyDir(imagesDirPath);
        hide();

        return outputUrls;
    };
}

type CommandDeleteHandlerSetup = { url: string; position?: { line: number; startIndex: number; endIndex: number; }; };
export function createOnCommandDeleteHandler() {
    return async function(setup: CommandDeleteHandlerSetup) {
        const { show, hide } = useStatusBar();

        const image = genImageWith(setup.url);
        if (!image) { return; };

        show(`正在删除${image.fullName}`);
        const res = await deleteImage(image.fullName);
        hide();
        if (!res) { return; };
        if (!setup.position) { return; };

        const { line, startIndex, endIndex } = setup.position;

        vscode.window.activeTextEditor?.edit(editBuilder => {
            editBuilder.delete(new vscode.Range(new vscode.Position(line, startIndex), new vscode.Position(line, endIndex)));
        });
    };
}

export function createOnMarkdownHoverHandler() {
    return function(document: vscode.TextDocument, position: vscode.Position) {
        const textLine = document.lineAt(position.line);
        const res = matchUrl(textLine.text);
        

        const fin = textLine.text.indexOf(res);
        const lin = textLine.text.lastIndexOf(res.substring(res.length - 1));

        if (matchUrl(textLine.text) && position.character > fin && position.character < lin) {
            const startIndex = textLine.text.substring(0, position.character).lastIndexOf("![");
            const endIndex = textLine.text.substring(position.character, textLine.text.length).indexOf(")") + position.character + 1;
            const delPosition = { line: position.line, startIndex, endIndex };
            const commentCommandUri = vscode.Uri.parse(
                `command:vscode-img-upload.delete?${encodeURIComponent(JSON.stringify({ url: res, position: delPosition }))}`
            );
            const contents = new vscode.MarkdownString(`[删除](${commentCommandUri})`);
            contents.isTrusted = true;
            return new vscode.Hover(contents);
        }
    };
}

export function createOnDidChangeTextDocumentHandler() {
    let preOutputText = "";
    return async function(event: vscode.TextDocumentChangeEvent) {
        if (!isPasteImage(event, preOutputText)) { return; };

        const outputUrls = await vscode.commands.executeCommand<string[]>(COMMAND_UPLOAD_KEY);

        const outputText = outputUrls.map((item) => `![](${item})`).join("\n");

        vscode.window.activeTextEditor?.edit(editBuilder => {
            editBuilder.replace(new vscode.Range(event.contentChanges[0].range.start, new vscode.Position(event.contentChanges[0].range.start.line, event.contentChanges[0].range.start.character + event.contentChanges[0].text.length)), outputText);
            // editBuilder.insert(new vscode.Position(event.contentChanges[0].range.start.line, event.contentChanges[0].text.length), "\n");
        });

        preOutputText = outputText;
    };
}