'use strict';
import * as path from 'node:path';
import { window, commands, Range, Position, Hover, Uri, MarkdownString } from 'vscode';

import { readRecord } from './record';
import { beforeUpload, uploaded } from './hook';
import { uploadImage, deleteImage } from './request';
import { showStatusBar, hideStatusBar } from './tips';
import { isImage, getClipboardImages, genImageWith } from './image';
import { getEventOpts, matchUrls, initPath, emptyDir } from './utils';
import { invokeWithErrorHandler, invokeWithErrorHandlerSync } from './error';
import { PLUGIN_NAME, COMMAND_UPLOAD_KEY, COMMAND_DELETE_KEY, IMAGE_DIR_PATH } from './constant';

import type { TextDocument, TextDocumentChangeEvent } from 'vscode';

export function createOnCommandUploadHandler() {
    async function handler(editRange?: Range) {
        await initPath();

        const images = await getClipboardImages();
        const outputTexts: string[] = [];
        
        for (const image of images) {
            showStatusBar(`正在上传${image.name}...`);
            beforeUpload(image);
            const text = uploaded(await uploadImage(image), image);
            text.length && outputTexts.push(text);
        }

        const editor = window.activeTextEditor;
        editor?.edit((editBuilder) => {
            if (editRange) {
                editBuilder.delete(editRange);
                editBuilder.insert(editRange.start, outputTexts.join("\n"));
            } else {
                editBuilder.insert(editor.selection.start, outputTexts.join("\n"));
            }
        });

        emptyDir(IMAGE_DIR_PATH);
        hideStatusBar();

        return outputTexts;
    };

    return invokeWithErrorHandler(handler);
}

export function createOnCommandDeleteHandler() {
    async function handler(url: string, delPosition?: { line: number; startIndex: number; endIndex: number; }) {
        const image = genImageWith(url);
        if (!image) { return; };

        showStatusBar(`正在删除${image.name}`);
        const res = await deleteImage(image.name);
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

            // find current url
            if (startIndex === -1 || endIndex === -1) {
                startIndex = lineText.indexOf(matchedUrl);
                endIndex = startIndex + matchedUrl.length;
            }

            const hasRecord = readRecord().find((item) => (item.image.url === matchedUrl));
    
            const delPosition = { line: position.line, startIndex, endIndex: endIndex + 1 };
            const commandArgs = [ matchedUrl, delPosition ];
            const commandUri = Uri.parse(`command:${COMMAND_DELETE_KEY}?${encodeURIComponent(JSON.stringify(commandArgs))}`);
            const contents = new MarkdownString(`[ ${PLUGIN_NAME} ] [同步删除](${commandUri})${!hasRecord ? " (未查询到此图片上传记录 可能会删除失败)" : ""}`);
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

        // calculate replace range
        const linesText = text.split("\n");
        const delEndTextLen = linesText[linesText.length - 1].length;
        const delLine = start.line + linesText.length -1;
        const delCharacter = linesText.length > 1 ? delEndTextLen : start.character + delEndTextLen;
        const editRange = new Range(start, new Position(delLine, delCharacter));

        // call
        const outputUrls = await commands.executeCommand<string[]>(COMMAND_UPLOAD_KEY, editRange);

        if (!outputUrls.length) { return; };
        // calculate recall position
        const preEndTextLen = outputUrls[outputUrls.length - 1].length;
        const preLine = start.line + outputUrls.length - 1;
        const preCharacter = outputUrls.length > 1 ? preEndTextLen : start.character + preEndTextLen;
        prePosition = new Position(preLine, preCharacter);
        preOutputText = outputUrls.join("\n");
        preText = text;
    };
    
    return invokeWithErrorHandler(handler);
}