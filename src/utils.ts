import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'crypto';
import * as vscode from 'vscode';

import { Image, isImage } from './image';

export const imagesDirPath = path.resolve(__dirname, "images");

export function isPasteImage(event: vscode.TextDocumentChangeEvent, preText: string): boolean {
    const cc = event.contentChanges;
    return !!cc.length && isImage(cc[0].text) && cc[0].text !== preText;
}

export function getFileMd5(buffer: any): string {
    return crypto.createHash('md5').update(buffer, 'utf8').digest('hex');
}

export function getHashPath(image: Image) {
    const buffer = fs.readFileSync(image.path);
    const hash = getFileMd5(buffer);
    const hashPath = path.resolve(imagesDirPath, `${hash}.${image.format}`);
    fs.copyFileSync(image.path, hashPath);
    return hashPath;
}

export function emptyDir(path: string) {
    const files = fs.readdirSync(path);
    files.forEach((file) => {
        const filePath = `${path}/${file}`;
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            emptyDir(filePath);
        } else {
            fs.unlinkSync(filePath);
        }
    });
}

export function matchUrl(str: string): string {
    const res = str.match(/(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g);
    return res && res.length ? res[0] : "";
}

const globalStatusBar = vscode.window.createStatusBarItem();
export function useStatusBar() {
    function show(text: string, tooltip?: string) {
        globalStatusBar.tooltip = new vscode.MarkdownString(tooltip);
        globalStatusBar.text = text;
        globalStatusBar.show();
    }

    function hide() {
        globalStatusBar.hide();
    }
    return { show, hide };
}