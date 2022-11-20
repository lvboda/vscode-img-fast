import * as path from 'node:path';
import { hasImage, readFilePaths, saveImageAsPng } from 'electron-clipboard-ex';

import { imagesDirPath } from './utils';

export type Image = {
    fullName: string;
    name: string;
    format: Format;
    path: string;
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

export const globalImageList = [];

function toFormat(str: string): Format {
    return Format[str as keyof typeof Format];
}

function checkFormat(str: string): str is Format {
    let flag = false;

    for (const item in Format) {
        str === item && (flag = true);
    }

    return flag;
}

function genImage(fullName: string, name: string, format: Format, path: string, url?: string): Image {
    return { fullName, name, format, path, url };
}

export function genImageWith(path: string): Image | null {
    if (!path || !path.length) { return null; };

    const imgFullName = path.substring(path.lastIndexOf("/") !== -1 ?  path.lastIndexOf("/") + 1 : 0, path.length);
    const dotPosition = imgFullName.lastIndexOf(".") + 1;
    const imgName = imgFullName.substring(0, dotPosition);
    const imgFormat = imgFullName.substring(dotPosition, imgFullName.length);
    if (!imgFullName || !imgName || !imgFormat || !checkFormat(imgFormat)) { return null; };

    return genImage(imgFullName, imgName, toFormat(imgFormat), path);
}

export function genImagesWith(paths?: string[]): Image[] {
    return paths && paths.length ? paths.map(genImageWith).filter((item) => !!item) as Image[] : [];
}

export function isImage(path: string): boolean {
    return !!genImageWith(path);
}

export async function getClipboardImages(): Promise<Image[]> {
    const resolvedImages = genImagesWith(readFilePaths());

    // no image
    if (!hasImage() && !resolvedImages.length) {
        return [];
    }

    // is screenshot
    if (hasImage() && !resolvedImages.length) {
        const tempPath = path.resolve(imagesDirPath, "temp.png");
        const ok = await saveImageAsPng(tempPath);
        return ok ? [genImage("temp.png", "temp", Format.png, tempPath)] : [];
    }

    // is local images
    return resolvedImages;
}