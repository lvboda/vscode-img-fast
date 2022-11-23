import { getHashPath, matchUrls, writeRecord } from './utils';
import { genImageWith } from './image';

import type { AxiosResponse } from 'axios';
import type { Image } from './image';

export function beforeUpload(image: Image) {
    image.beforeUploadPath = getHashPath(image);
    const resolvedImage = genImageWith(image.beforeUploadPath);
    resolvedImage && (image.beforeUploadName = resolvedImage.name);
}

export function uploaded(res: AxiosResponse, image: Image) {
    const { status, statusText, data, config } = res;
    const matchedUrls = matchUrls(data);

    if (status !== 200) {
        throw Error(`<request error: http status error> url: ${config.url}, method: ${config.method}, status: ${status}, statusText: ${statusText}, response: ${data}.`);
    }

    if (!matchedUrls.length) {
        throw Error(`<response error: no matched url> url: ${config.url}, method: ${config.method}, status: ${status}, statusText: ${statusText}, response: ${data}.`);
    }

    image.url = matchedUrls[0];
    writeRecord(image, res);
}