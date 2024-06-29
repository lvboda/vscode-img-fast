import * as fs from 'node:fs';

import { RECORD_FILE_PATH } from './constant';
import { isEqual } from './image';

import type { AxiosResponse } from 'axios';
import type { Image } from './image';

type Record = {
    time: string | Date;
    response: AxiosResponse;
    image?: Image;
};
// TODO 这里设计的有问题 频繁读写文件会导致性能问题
// 简单加个catch解决类似错误 Error: ENOENT: no such file or directory, open 'xxx'
export function readRecord() {
    try {
        return JSON.parse(fs.readFileSync(RECORD_FILE_PATH, { encoding: "utf8" })) as Record[];
    } catch {
        return [];
    }
}

export function writeRecord(response: AxiosResponse, image?: Image, maxStorageCount = 500) {
    try {
        delete response.request;

        let records = readRecord();
        image && (records = records.filter((item) => (item.image && image && !isEqual(item.image, image))));
    
        records.length > maxStorageCount && records.shift();
        
        records.push({ time: new Date(), response, image });
        fs.writeFileSync(RECORD_FILE_PATH, JSON.stringify(records), { encoding: "utf8" });
    } catch {}
}