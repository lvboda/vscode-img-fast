import * as fs from 'node:fs';
import * as path from 'node:path';
import { window, commands, Range, Position, Hover, Uri, MarkdownString, EndOfLine } from 'vscode';

import { uploadImage, deleteImage } from './request';
import { showStatusBar, hideStatusBar } from './tips';
import { getEventOpts, matchUrls, getHashPath, emptyDir } from './utils';
import { invokeWithErrorHandler, invokeWithErrorHandlerSync } from './error';
import { isImage, getClipboardImages, genImageWith, genImagesWith } from './image';
import { COMMAND_UPLOAD_KEY, COMMAND_DELETE_KEY, IMAGE_DIR_PATH } from './constant';

import type { TextDocument, TextDocumentChangeEvent } from 'vscode';

export function createOnCommandUploadHandler() {
    async function handler(imagePaths?: string[], showTips = true) {
        fs.access(IMAGE_DIR_PATH, fs.constants.F_OK, (err) => (err && fs.mkdirSync(IMAGE_DIR_PATH)));

        const inputImages = genImagesWith(imagePaths);
        const images = inputImages.length ? inputImages : await getClipboardImages();
        const outputUrls = [];
        
        for (const image of images) {
            showTips && showStatusBar(`正在上传${image.basename}...`);

            const hashPath = getHashPath(image);
            const url = matchUrls(await uploadImage(hashPath));
            url.length && outputUrls.push(url[0]) && (image.url = url[0]);
        }

        emptyDir(IMAGE_DIR_PATH);
        hideStatusBar();

        return outputUrls;
    };

    return invokeWithErrorHandler(handler);
}

export function createOnCommandDeleteHandler() {
    async function handler(url: string, delPosition?: { line: number; startIndex: number; endIndex: number; }) {
        const image = genImageWith(url);
        if (!image) { return; };

        showStatusBar(`正在删除${image.basename}`);
        const res = await deleteImage(image.basename);
        hideStatusBar();
        if (!res) { return; };

        if (!delPosition) { return; };
        const { line, startIndex, endIndex } = delPosition;
        window.activeTextEditor?.edit((editBuilder) => editBuilder.delete(new Range(new Position(line, startIndex), new Position(line, endIndex))));
    };

    return invokeWithErrorHandler(handler);
}

export function createOnMarkdownHoverHandler() {
    function handler(document: TextDocument, position: Position) {
        const lineText = document.lineAt(position.line).text;
        const matchedUrls = matchUrls(lineText).filter((url) => (!!path.extname(url) && isImage(url)) || !path.extname(url));

        for (const matchedUrl of matchedUrls) {
            // exclude cursor not on link
            const urlStartIndex = lineText.indexOf(matchedUrl) - 1;
            const urlEndIndex = lineText.indexOf(matchedUrl) + matchedUrl.length;
            if (!(position.character > urlStartIndex && position.character < urlEndIndex)) { continue; };

            // find index: ![...](...)
            let startIndex = lineText.lastIndexOf("![", position.character);
            let endIndex = lineText.indexOf(")", position.character);

            // find index: <img src="..."></img>
            if (startIndex === -1 || endIndex === -1) {
                startIndex = lineText.lastIndexOf("<", position.character);
                endIndex = lineText.indexOf("/>", position.character);
                endIndex === -1 && (endIndex = lineText.indexOf("img>", position.character));
                endIndex === -1 && (endIndex = lineText.indexOf(">", position.character));
            }

            const delPosition = startIndex !== -1 && endIndex !== -1 && { line: position.line, startIndex, endIndex: endIndex + 1 };
            const commandArgs = [ matchedUrl, delPosition ];
            const commandUri = Uri.parse(`command:${COMMAND_DELETE_KEY}?${encodeURIComponent(JSON.stringify(commandArgs))}`);

            const contents = new MarkdownString(`[删除](${commandUri})`);
            contents.isTrusted = true;

            return new Hover(contents);
        }
    };

    return invokeWithErrorHandlerSync(handler);
}

export function createOnDidChangeTextDocumentHandler() {
    let preText = "";
    let preOutputText = "";
    let prePosition: Position;
    async function handler(event: TextDocumentChangeEvent) {
        const { text, range: { start } } = getEventOpts(event);

        // if not paste image
        if (!isImage(text) || preOutputText === text) { return; };
        // if recall
        if (preText === text && prePosition && start.isEqual(prePosition)) { return; };

        const outputUrls = await commands.executeCommand<string[]>(COMMAND_UPLOAD_KEY);

        if (!outputUrls.length) { return; };

        const outputList = outputUrls.map((item) => `![](${item})`);
        const linesText = text.split("\n");
        
        window.activeTextEditor?.edit((editBuilder) => {
            const delEndTextLen = linesText[linesText.length - 1].length;
            const delLine = start.line + linesText.length -1;
            const delCharacter = linesText.length > 1 ? delEndTextLen : start.character + delEndTextLen;

            editBuilder.delete(new Range(start, new Position(delLine, delCharacter)));
            editBuilder.insert(start, outputList.join("\n"));
        });

        const preEndTextLen = outputList[outputList.length - 1].length;
        const preLine = start.line + outputList.length - 1;
        const preCharacter = outputList.length > 1 ? preEndTextLen : start.character + preEndTextLen;
        prePosition = new Position(preLine, preCharacter);
        preOutputText = outputList.join("\n");
        preText = text;
    };
    
    return invokeWithErrorHandler(handler);
}