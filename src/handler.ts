'use strict';
import * as path from 'node:path';
import { window, commands, Range, Position, Hover, Uri, MarkdownString } from 'vscode';

import localize from './localize';
import { getConfig } from './config';
import { readRecord } from './record';
import { uploadImage, deleteImage } from './request';
import { showStatusBar, hideStatusBar } from './tips';
import { beforeUpload, uploaded, deleted } from './hook';
import { isImage, getClipboardImages, genImageWith } from './image';
import { getEventOpts, matchUrls, initPath, emptyDir } from './utils';
import { invokeWithErrorHandler, invokeWithErrorHandlerSync } from './error';
import { PLUGIN_NAME, COMMAND_UPLOAD_KEY, COMMAND_DELETE_KEY, IMAGE_DIR_PATH } from './constant';

import type { TextDocument, TextDocumentChangeEvent } from 'vscode';
import type { AxiosResponse } from 'axios';

const { openPasteAutoUpload, uploadUrl, deleteUrl } = getConfig();

export function createOnCommandUploadHandler() {
    async function handler(editRange?: Range) {
        if (!uploadUrl || !uploadUrl.length) throw Error(`uploadUrl ${localize("handler.notNull")}`);

        await initPath();

        const images = await getClipboardImages();
        if (!images.length) return [];
        const outputTexts: string[] = [];

        for (const image of images) {
            showStatusBar(`${localize("handler.uploading")}${image.basename}...`);
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
    async function handler(url?: string, position?: Position) {
        if (!deleteUrl || !deleteUrl.length) throw Error(`deleteUrl ${localize("handler.notNull")}`);

        if (!url || !position) {
            const selection = window.activeTextEditor?.selection;
            const document = window.activeTextEditor?.document;
            if (!selection || !document) return;

            // if selected
            if (!selection.start.isEqual(selection.end)) {
                const text = document.getText(selection);
                const urls = matchUrls(text);
                let res;
                for (const url of urls) {
                    const image = genImageWith(url);
                    if (!image) return;
                    showStatusBar(`${localize("handler.deleting")}${image.basename}...`);
                    res = await deleteImage(image.basename);
                    hideStatusBar();
                }
                deleted(res as AxiosResponse, "", new Position(NaN, NaN), selection);
                return;
            }

            const text = document.lineAt(selection.start.line).text;
            const urls = matchUrls(text);
            if (!urls.length) return;
            url = urls[0];
            position = new Position(selection.start.line, NaN);;
        }

        const image = genImageWith(url);
        if (!image) return;
        showStatusBar(`${localize("handler.deleting")}${image.basename}...`);
        deleted(await deleteImage(image.basename), url, position);
        hideStatusBar();
    };

    return invokeWithErrorHandler(handler);
}

export function createOnMarkdownHoverHandler() {
    if (!deleteUrl || !deleteUrl.length) return () => void 0;

    function handler(document: TextDocument, position: Position) {
        const lineText = document.lineAt(position.line).text;
        const matchedUrls = matchUrls(lineText).filter((url) => (!!path.extname(url) && isImage(url)) || !path.extname(url));

        for (const matchedUrl of matchedUrls) {
            // exclude cursor not on link
            const urlStartIndex = lineText.indexOf(matchedUrl) - 1;
            const urlEndIndex = lineText.indexOf(matchedUrl) + matchedUrl.length;
            if (!(position.character > urlStartIndex && position.character < urlEndIndex)) continue;

            const hasRecord = readRecord().find((item) => item.image && item.image.url === matchedUrl);

            const commandUri = Uri.parse(`command:${COMMAND_DELETE_KEY}?${encodeURIComponent(JSON.stringify([matchedUrl, position]))}`);
            const contents = new MarkdownString(`[ ${PLUGIN_NAME} ] [${localize("handler.syncDelete")}](${commandUri})${!hasRecord ? ` (${localize("handler.syncDeleteTips")})` : ""}`);
            contents.isTrusted = true;

            return new Hover(contents);
        }
    };

    return invokeWithErrorHandlerSync(handler);
}

export function createOnDidChangeTextDocumentHandler() {
    if (!openPasteAutoUpload) return () => void 0;

    let preText = "";
    let preOutputText = "";
    let prePosition: Position;
    async function handler(event: TextDocumentChangeEvent) {
        const { text, range: { start } } = getEventOpts(event);

        // if not paste image
        if (!isImage(text) || preOutputText === text) return;
        // if recall
        if (preText === text && prePosition && start.isEqual(prePosition)) return;

        // calculate replace range
        const linesText = text.split("\n");
        const delEndTextLen = linesText[linesText.length - 1].length;
        const delLine = start.line + linesText.length - 1;
        const delCharacter = linesText.length > 1 ? delEndTextLen : start.character + delEndTextLen;
        const editRange = new Range(start, new Position(delLine, delCharacter));

        // call
        const outputUrls = await commands.executeCommand<string[]>(COMMAND_UPLOAD_KEY, editRange);

        if (!outputUrls.length) return;
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