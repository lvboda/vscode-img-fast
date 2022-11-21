import * as path from 'node:path';
import { hasImage, readFilePaths, saveImageAsPng } from 'electron-clipboard-ex';

import { IMAGE_DIR_PATH } from './constant';

export type Image = {
    basename: string;
    name: string;
    format: Format;
    path: string;
    hash?: string;
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

function checkFormat(str: string): str is Format {
    let flag = false;

    for (const item in Format) {
        str === item && (flag = true);
    }

    return flag;
}

function genImage(basename: string, name: string, format: Format, path: string, url?: string): Image {
    return { basename, name, format, path, url };
}

export function genImageWith(filePath?: string) {
    if (!filePath || !filePath.length) { return null; };

    const imgBasename = path.basename(filePath);
    const ext = path.extname(filePath);
    const imgName = imgBasename.replace(ext, "");
    const imgFormat = ext.replace(".", "");
    if (!imgBasename || !imgName || !imgFormat || !checkFormat(imgFormat)) { return null; };

    return genImage(imgBasename, imgName, toFormat(imgFormat), filePath);
}

export function genImagesWith(filePaths?: string[]) {
    return filePaths && filePaths.length ? filePaths.map(genImageWith).filter((item) => !!item) as Image[] : [];
}

export function isImage(path: string) {
    return !!genImageWith(path);
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
        return ok ? [genImage("screenshot.png", "screenshot", Format.png, tempPath)] : [];
    }

    // is local images
    return resolvedImages;
}