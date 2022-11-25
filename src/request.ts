'use strict';
import * as fs from 'node:fs';
import * as formData from 'form-data';
import { Axios } from 'axios';

import { getConfig } from './config';

import type { AxiosResponse } from 'axios';
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
    return await axios.request<string>({
        url: deleteQueryKey.length
            ? `${deleteUrl}?${deleteQueryKey}=${name}`
            : `${deleteUrl}${name}`,
        method: deleteMethod,
    });
}