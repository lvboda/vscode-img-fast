import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'crypto';

import { IMAGE_DIR_PATH, RECORD_FILE_PATH } from './constant';

import type { TextDocumentChangeEvent, Range } from 'vscode';
import type { AxiosResponse } from 'axios';
import type { Image } from './image';

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

export function initPath() {
    fs.access(IMAGE_DIR_PATH, fs.constants.F_OK, (err) => (err && fs.mkdirSync(IMAGE_DIR_PATH)));
    fs.access(RECORD_FILE_PATH, fs.constants.F_OK, (err) => (err && fs.writeFileSync(RECORD_FILE_PATH, "[]")));
}

type RecordItem = {
    time: string | Date;
    image: Image;
    response: AxiosResponse;
};

export function readRecord() {
    return JSON.parse(fs.readFileSync(RECORD_FILE_PATH, { encoding: "utf8" })) as RecordItem[];
}

export function writeRecord(image: Image, response: AxiosResponse, maxStorageCount = 500) {
    delete response.request;
    const record = readRecord();
    record.length > maxStorageCount && record.shift();
    record.push({ time: new Date(), image, response });
    fs.writeFileSync(RECORD_FILE_PATH, JSON.stringify(record), { encoding: "utf8" });
}