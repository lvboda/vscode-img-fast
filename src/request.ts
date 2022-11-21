import * as fs from 'node:fs';

import { Axios } from 'axios';
import * as formData from 'form-data';

const axios = new Axios({
    headers: {
        "Authorization": "BD1010110",
    },
});

export async function uploadImage(path: string) {
    const form = new formData();
    form.append("img", fs.createReadStream(path));

    const res = await axios.request<string>({
        url: "http://localhost:8000/",
        method: "POST",
        headers: form.getHeaders(),
        data: form,
    });

    return res.status === 200 ? res.data : "";
}

export async function deleteImage(name: string) {
    const res = await axios.request<string>({
        url: `http://localhost:8000/${name}`,
        method: "DELETE",
    });

    return res.status === 200 ? res.data : "";
}