import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'crypto';
import * as vscode from 'vscode';

import { Image } from './image';

export const imagesDirPath = path.resolve(__dirname, "images");

export function getEventOpts(event: vscode.TextDocumentChangeEvent) {
    const cc = event.contentChanges;
    return cc.length ? cc[0] : { text: "", range: {} as vscode.Range };
}

export function getFileMd5(buffer: any) {
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

export function matchUrls(str: string): string[] {
    const matchedUrls = str.match(/(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g);
    return matchedUrls ? matchedUrls : [];
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