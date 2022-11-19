"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchUrl = exports.emptyDir = exports.getHashPath = exports.getFileMd5 = exports.isPaste = exports.imagesDirPath = void 0;
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("crypto");
const image_1 = require("./image");
exports.imagesDirPath = path.resolve(__dirname, "images");
function isPaste(event) {
    return !!event.contentChanges.length && (0, image_1.isImage)(event.contentChanges[0].text);
}
exports.isPaste = isPaste;
function getFileMd5(buffer) {
    return crypto.createHash('md5').update(buffer, 'utf8').digest('hex');
}
exports.getFileMd5 = getFileMd5;
function getHashPath(image) {
    const buffer = fs.readFileSync(image.path);
    const hash = getFileMd5(buffer);
    const hashPath = path.resolve(exports.imagesDirPath, `${hash}.${image.format}`);
    fs.copyFileSync(image.path, hashPath);
    return hashPath;
}
exports.getHashPath = getHashPath;
function emptyDir(path) {
    const files = fs.readdirSync(path);
    files.forEach((file) => {
        const filePath = `${path}/${file}`;
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            emptyDir(filePath);
        }
        else {
            fs.unlinkSync(filePath);
        }
    });
}
exports.emptyDir = emptyDir;
function matchUrl(str) {
    const res = str.match(/(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g);
    return res && res.length ? res[0] : "";
}
exports.matchUrl = matchUrl;
//# sourceMappingURL=utils.js.map