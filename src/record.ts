'use strict';
import * as fs from 'node:fs';

import { RECORD_FILE_PATH } from './constant';
import { isEqual } from './image';

import type { AxiosResponse } from 'axios';
import type { Image } from './image';

type Record = {
    time: string | Date;
    image: Image;
    response: AxiosResponse;
};

export function readRecord() {
    return JSON.parse(fs.readFileSync(RECORD_FILE_PATH, { encoding: "utf8" })) as Record[];
}

export function writeRecord(image: Image, response: AxiosResponse, maxStorageCount = 500) {
    delete response.request;
    const records = readRecord().filter((item) => !isEqual(item.image, image));
    records.length > maxStorageCount && records.shift();
    records.push({ time: new Date(), image, response });
    fs.writeFileSync(RECORD_FILE_PATH, JSON.stringify(records), { encoding: "utf8" });
}