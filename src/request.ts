import * as fs from 'node:fs';

import { Axios } from 'axios';
import * as formData from 'form-data';

import type { AxiosResponse } from 'axios';

const axios = new Axios({
    headers: {
        "Authorization": "BD1010110",
    },
});

function resolveRes(res: AxiosResponse<string>) {
    const { status, statusText, data, config } = res;
    if (status !== 200) {
        throw Error(`http request error, url: ${config.url}, method: ${config.method}, status: ${status}, statusText: ${statusText}.`);
    }
    return data;
}

export async function uploadImage(path: string) {
    const form = new formData();
    form.append("img", fs.createReadStream(path));

    const res = await axios.request<string>({
        url: "http://localhost:8000/",
        method: "POST",
        headers: form.getHeaders(),
        data: form,
    });

    return resolveRes(res);
}

export async function deleteImage(name: string) {
    const res = await axios.request<string>({
        url: `http://localhost:8000/${name}`,
        method: "DELETE",
    });

    return resolveRes(res);
}