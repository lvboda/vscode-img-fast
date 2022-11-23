import * as path from 'node:path';
import { hasImage, readFilePaths, saveImageAsPng } from 'electron-clipboard-ex';

import { IMAGE_DIR_PATH } from './constant';

export type Image = {
    name: string;
    format: Format;
    path: string;
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

function genImage(
    name: string,
    format: Format,
    path: string,
    beforeUploadPath = "",
    beforeUploadName = "",
    url?: string
): Image {
    return { name, format, path, beforeUploadPath, beforeUploadName, url };
}

export function genImageWith(filePath?: string) {
    if (!filePath || !filePath.length) { return null; };

    const imgName = path.basename(filePath);
    const ext = path.extname(filePath);
    const imgFormat = ext.replace(".", "");
    if (!imgName || !imgFormat || !checkFormat(imgFormat)) { return null; };

    return genImage(imgName, toFormat(imgFormat), filePath);
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
        return ok ? [genImage("screenshot.png", Format.png, tempPath)] : [];
    }

    // is local images
    return resolvedImages;
}