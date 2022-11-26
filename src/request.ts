'use strict';
import * as fs from 'node:fs';
import * as formData from 'form-data';
import { Axios } from 'axios';

import { getConfig } from './config';

import type { Image } from './image';

const {
    authorization,
    uploadUrl,
    uploadMethod,
    uploadFormDataKey,
    deleteUrl,
    deleteMethod,
    deleteQueryKey
} = getConfig();

const axios = new Axios({ headers: { Authorization: authorization } });

export async function uploadImage(image: Image) {
    const form = new formData();
    form.append(uploadFormDataKey, fs.createReadStream(image.beforeUploadPath));

    return await axios.request<string>({
        url: uploadUrl,
        method: uploadMethod,
        headers: form.getHeaders(),
        data: form,
    });
}

export async function deleteImage(name: string) {
    let url = deleteUrl.endsWith("/") ? `${deleteUrl}${name}` : `${deleteUrl}/${name}`;
    if (deleteQueryKey) {
        const [ baseUrl, args ] = deleteUrl.split("?");
        const params = new URLSearchParams(args);
        params.append(deleteQueryKey, name);
        url = `${baseUrl}?${params.toString()}`;
    }
    
    return await axios.request<string>({
        url,
        method: deleteMethod,
    });
}