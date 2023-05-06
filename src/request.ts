import * as fs from 'node:fs';
import * as formData from 'form-data';
import { Axios } from 'axios';

import { getConfig } from './config';

import type { Image } from './image';

const axios = new Axios({});

export async function uploadImage(image: Image) {
    const { authorization, uploadUrl, uploadMethod, uploadFormDataKey } = getConfig();

    const form = new formData();
    form.append(uploadFormDataKey, fs.createReadStream(image.beforeUploadPath));

    // TODO 这里先简单处理 以后要支持更多图床的时候把逻辑提出来
    if (uploadUrl?.includes('//vgy.me')) form.append('userkey', authorization);

    return await axios.request<string>({
        url: uploadUrl,
        method: uploadMethod,
        headers: form.getHeaders({ Authorization: authorization }),
        data: form,
    });
}

export async function deleteImage(name: string) {
    const { authorization, deleteUrl, deleteMethod, deleteQueryKey } = getConfig();

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
        headers: { Authorization: authorization }
    });
}