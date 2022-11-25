'use strict';
import * as path from 'node:path';
import { hasImage, readFilePaths, saveImageAsPng } from 'electron-clipboard-ex';

import { IMAGE_DIR_PATH } from './constant';
import { getFileHash } from './utils';

export type Image = {
    basename: string;
    name: string;
    format: Format;
    path: string;
    hash: string;
    beforeUploadPath: string;
    beforeUploadName: string;
    url?: string;
};

enum Format {
    png = 'png',
    jpg = 'jpg',
    jpeg = 'jpeg',
    bmp = 'bmp',
    gif = 'gif',
    webp = 'webp',
    psd = 'psd',
    svg = 'svg',
    tiff = 'tiff',
}

function toFormat(str: string) {
    return Format[str as keyof typeof Format];
}

function checkFormat(ext: string): ext is Format {
    let flag = false;

    for (const item in Format) {
        ext === item && (flag = true);
    }

    return flag;
}

export function genImage(
    basename: string,
    name: string,
    format: Format,
    path: string,
    hash: string,
    beforeUploadPath = "",
    beforeUploadName = "",
    url?: string
): Image {
    return { basename, name, format, path, hash, beforeUploadPath, beforeUploadName, url };
}

export function genImageWith(filePath?: string) {
    if (!filePath || !filePath.length) { return null; };

    const imgBasename = path.basename(filePath);
    const ext = path.extname(filePath);
    const imgName = imgBasename.replace(ext, "");
    const imgFormat = ext.replace(".", "");
    if (!imgBasename || !imgFormat || !checkFormat(imgFormat)) { return null; };

    return genImage(imgBasename, imgName, toFormat(imgFormat), filePath, getFileHash(filePath));
}

export function genImagesWith(filePaths?: string[]) {
    return filePaths && filePaths.length ? filePaths.map(genImageWith).filter((item) => !!item) as Image[] : [];
}

export function isImage(path: string) {
    return !!genImageWith(path);
}

export function isEqual(image1: Image, image2: Image) {
    return (
        image1.hash === image2.hash &&
        image1.beforeUploadPath === image2.beforeUploadPath &&
        image1.beforeUploadName === image2.beforeUploadName &&
        image1.url === image2.url
    );
}

export async function getClipboardImages() {
    const resolvedImages = genImagesWith(readFilePaths());

    // no image
    if (!hasImage() && !resolvedImages.length) {
        return [];
    }

    // is screenshot
    if (hasImage() && !resolvedImages.length) {
        const tempPath = path.resolve(IMAGE_DIR_PATH, "screenshot.png");
        const ok = await saveImageAsPng(tempPath);
        return ok ? [genImage("screenshot.png", "screenshot", Format.png, tempPath, getFileHash(tempPath))] : [];
    }

    // is local images
    return resolvedImages;
}