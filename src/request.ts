import * as fs from 'node:fs';

import * as axios from 'axios';
import * as formData from 'form-data';

const request = new axios.Axios({
    headers: {
        Authorization: "BD1010110",
    }
});

export async function upload(path: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const form = new formData();
    form.append("img", fs.createReadStream(path));

    const res = await request.post("http://localhost:8000/", form, { headers: form.getHeaders() });

    return res.status === 200 ? res.data : "";
}