"use strict";
import * as fs from "node:fs";
import * as crypto from "crypto";

import { IMAGE_DIR_PATH, RECORD_FILE_PATH } from "./constant";

import type { TextDocumentChangeEvent, Range } from "vscode";
import type { Image } from "./image";

export function getEventOpts(event: TextDocumentChangeEvent) {
    const cc = event.contentChanges;
    return cc.length ? cc[0] : { text: "", range: {} as Range };
}

export function getFileHash(path: string) {
    try {
        const buffer = fs.readFileSync(path);
        return crypto.createHash("md5").update(buffer).digest("hex");
    } catch (err: any) {
        if (err.code === "ENOENT") return "";
        throw err;
    }
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
    const matchedUrls = str.match(
        /(https?|http|ftp):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g
    ) as string[];
    return matchedUrls ? matchedUrls : [];
}

export async function initPath() {
    return new Promise((resolve) => {
        fs.access(IMAGE_DIR_PATH, fs.constants.F_OK, (err) => {
            err && fs.mkdirSync(IMAGE_DIR_PATH);
            fs.access(RECORD_FILE_PATH, fs.constants.F_OK, (err) => {
                err && fs.writeFileSync(RECORD_FILE_PATH, "[]");
                resolve(null);
            });
        });
    });
}

export function dateFormat(fmt: string) {
    const date = new Date();
    const o = {
        "M+": date.getMonth() + 1,
        "d+": date.getDate(),
        "h+": date.getHours(),
        "m+": date.getMinutes(),
        "s+": date.getSeconds(),
        "q+": Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds(),
    };
    fmt = fmt.replace(/(y+)/g, (_, p1) => date.getFullYear().toString().substring(4 - p1.length));
    Object.entries(o).forEach(([k, v]) => {
        fmt = fmt.replace(new RegExp("(" + k + ")", "g"), (_, p1) =>
            p1.length === 1 ? v.toString() : ("00" + v).substring(("" + v).length)
        );
    });
    return fmt;
}

export function customFormat(fmt: string, image: Image) {
    return fmt.replace(/\$\{(.+?)\}/g, (_, p1) => {
        if (p1 === "timestamp") return new Date().getTime().toString();
        const value = image[p1 as keyof Image];
        if (value) return value;
        return dateFormat(p1);
    });
}
