"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPasteEvent = void 0;
const fs = require("node:fs");
const vscode = require("vscode");
const image_1 = require("./image");
const request_1 = require("./request");
const utils_1 = require("./utils");
function createPasteEvent() {
    let preOutputText = "";
    const statusBar = vscode.window.createStatusBarItem();
    return async function (event) {
        if ((0, utils_1.isPaste)(event) && event.contentChanges[0].text !== preOutputText) {
            fs.access(utils_1.imagesDirPath, fs.constants.F_OK, (err) => (err && fs.mkdirSync(utils_1.imagesDirPath)));
            const images = await (0, image_1.getClipboardImages)();
            let outputText = "";
            for (const image of images) {
                statusBar.hide();
                statusBar.text = `正在上传${image.fullName}...`;
                statusBar.show();
                const hashPath = (0, utils_1.getHashPath)(image);
                image.path = hashPath;
                const res = await (0, request_1.upload)(hashPath);
                const url = (0, utils_1.matchUrl)(res);
                if (!url) {
                    return;
                }
                outputText = outputText.concat(`![](${url})`);
            }
            if (!outputText) {
                return;
            }
            preOutputText = outputText;
            vscode.window.activeTextEditor?.edit(editBuilder => {
                editBuilder.replace(new vscode.Selection(event.contentChanges[0].range.start, new vscode.Position(event.contentChanges[0].range.start.line, event.contentChanges[0].text.length)), outputText);
                editBuilder.insert(new vscode.Position(event.contentChanges[0].range.start.line, event.contentChanges[0].text.length), "\n");
            });
            (0, utils_1.emptyDir)(utils_1.imagesDirPath);
            statusBar.hide();
        }
    };
}
exports.createPasteEvent = createPasteEvent;
//# sourceMappingURL=event.js.map