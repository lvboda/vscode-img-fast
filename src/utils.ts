import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'crypto';

import { Image } from './image';
import { IMAGE_DIR_PATH } from './constant';

import type { TextDocumentChangeEvent, Range } from 'vscode';

export function getEventOpts(event: TextDocumentChangeEvent) {
    const cc = event.contentChanges;
    return cc.length ? cc[0] : { text: "", range: {} as Range };
}

export function getFileMd5(buffer: any) {
    return crypto.createHash('md5').update(buffer, 'utf8').digest('hex');
}

export function getHashPath(image: Image) {
    const buffer = fs.readFileSync(image.path);
    const hash = getFileMd5(buffer);
    image.hash = hash;
    const hashPath = path.resolve(IMAGE_DIR_PATH, `${hash}.${image.format}`);
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

export function matchUrls(str: string) {
    const matchedUrls = str.match(/(https?|http|ftp):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g) as string[];
    return matchedUrls ? matchedUrls : [];
}