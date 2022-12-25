import * as fs from 'node:fs';
import * as path from 'node:path';
import { window, Range, Position } from 'vscode';

import localize from './localize';
import { getConfig } from './config';
import { writeRecord } from './record';
import { IMAGE_DIR_PATH } from './constant';
import { matchUrls, customFormat } from './utils';

import type { AxiosResponse } from 'axios';
import type { Image } from './image';

function genHttpError(res: AxiosResponse, title: string) {
    const { status, statusText, data, config } = res;
    return Error(`${title} | url: ${config.url}, method: ${config.method}, status: ${status}, statusText: ${statusText}, response: ${data}.`);
}

export function beforeUpload(image: Image) {
    const beforeUploadName = customFormat(getConfig().imgRename, image);
    const beforeUploadPath = path.resolve(IMAGE_DIR_PATH, `${beforeUploadName}.${image.format}`);
    fs.copyFileSync(image.path, beforeUploadPath);
    image.beforeUploadName = beforeUploadName;
    image.beforeUploadPath = beforeUploadPath;
}

export function uploaded(res: AxiosResponse, image: Image) {
    const { uploadedKey, outputRename } = getConfig();

    image.url = uploadedKey && JSON.parse(res.data) && JSON.parse(res.data)[uploadedKey];
    !image.url && (image.url = matchUrls(res.data.replace(/\\/g, ""))[0]);
    writeRecord(res, image);

    if (res.status !== 200) throw genHttpError(res, localize("hook.uploadStatusError"));

    if (!image.url) throw genHttpError(res, localize("hook.uploadNoMatchedUrl"));

    return customFormat(outputRename, image);
}

export function deleted(res: AxiosResponse, url: string, position: Position, delRange?: Range) {
    writeRecord(res);
    
    if (res.status !== 200) throw genHttpError(res, localize("hook.deleteStatusError"));

    const editor = window.activeTextEditor?.edit;
    const document = window.activeTextEditor?.document;
    if (!editor || !document) return;

    editor((editBuilder) => {
        if (delRange) {
            editBuilder.delete(delRange);
            return;
        }

        const lineText = document.lineAt(position.line).text;
        switch (getConfig().deletedFlag) {
            case "url":
                const start = lineText.indexOf(url);
                editBuilder.delete(new Range(new Position(position.line, start), new Position(position.line, start + url.length)));
                break;
            case "layout":
                let matched = lineText.match(new RegExp(`\\!\\[.*?\\]\\(${url}.*?\\)`, "g"));
                !matched && (matched = lineText.match(new RegExp(`\\<img.*?src=("|')${url}("|').*\\>.*\\<*img.*\\/\\>`, "g")));
                !matched && (matched = lineText.match(new RegExp(`\\<img.*?src=("|')${url}("|').*\\/>`, "g")));
                !matched && (matched = [url]);

                const resolved = matched
                    .map((item) => ({ start: lineText.indexOf(item), end: lineText.indexOf(item) + item.length }))
                    .filter((item) => (position.character && item.start < position.character && item.end > position.character) || !position.character);

                editBuilder.delete(new Range(new Position(position.line, resolved[0].start), new Position(position.line, resolved[0].end)));
                break;
            default:
                // none;
                break;
        }
    });
}