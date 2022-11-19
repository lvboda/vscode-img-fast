"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClipboardImages = exports.isImage = void 0;
const path = require("node:path");
const electron_clipboard_ex_1 = require("electron-clipboard-ex");
const utils_1 = require("./utils");
var Format;
(function (Format) {
    Format["png"] = "png";
    Format["jpg"] = "jpg";
    Format["jpeg"] = "jpeg";
    Format["bmp"] = "bmp";
    Format["gif"] = "gif";
    Format["webp"] = "webp";
    Format["psd"] = "psd";
    Format["svg"] = "svg";
    Format["tiff"] = "tiff";
})(Format || (Format = {}));
function toFormat(str) {
    return Format[str];
}
function checkFormat(str) {
    let flag = false;
    for (const item in Format) {
        str === item && (flag = true);
    }
    return flag;
}
function genImage(fullName, name, format, path, url) {
    return { fullName, name, format, path, url };
}
function genImageWithPath(path) {
    if (!path || !path.length) {
        return null;
    }
    const imgFullName = path.substring(path.lastIndexOf("/") !== -1 ? path.lastIndexOf("/") + 1 : 0, path.length);
    const dotPosition = imgFullName.lastIndexOf(".") + 1;
    const imgName = imgFullName.substring(0, dotPosition);
    const imgFormat = imgFullName.substring(dotPosition, imgFullName.length);
    if (!imgFullName || !imgName || !imgFormat || !checkFormat(imgFormat)) {
        return null;
    }
    return genImage(imgFullName, imgName, toFormat(imgFormat), path);
}
function isImage(path) {
    return !!genImageWithPath(path);
}
exports.isImage = isImage;
async function getClipboardImages() {
    const resolvedImages = (0, electron_clipboard_ex_1.readFilePaths)().map(genImageWithPath).filter((item) => !!item);
    // no image
    if (!(0, electron_clipboard_ex_1.hasImage)() && !resolvedImages.length) {
        return [];
    }
    // is screenshot
    if ((0, electron_clipboard_ex_1.hasImage)() && !resolvedImages.length) {
        const tempPath = path.resolve(utils_1.imagesDirPath, "temp.png");
        const ok = await (0, electron_clipboard_ex_1.saveImageAsPng)(tempPath);
        return ok ? [genImage("temp.png", "temp", Format.png, tempPath)] : [];
    }
    // is local images
    return resolvedImages;
}
exports.getClipboardImages = getClipboardImages;
//# sourceMappingURL=image.js.map