"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const fs = require("node:fs");
const axios = require("axios");
const formData = require("form-data");
const request = new axios.Axios({
    headers: {
        Authorization: "BD1010110",
    }
});
async function upload(path) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const form = new formData();
    form.append("img", fs.createReadStream(path));
    const res = await request.post("http://localhost:8000/", form, { headers: form.getHeaders() });
    return res.status === 200 ? res.data : "";
}
exports.upload = upload;
//# sourceMappingURL=request.js.map