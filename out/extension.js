"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const event_1 = require("./event");
const utils_1 = require("./utils");
function activate(context) {
    vscode.workspace.onDidChangeTextDocument((0, event_1.createPasteEvent)());
    const disposable = vscode.commands.registerCommand('vscode-img-upload.paste', (0, event_1.createPasteEvent)());
    context.subscriptions.push(disposable);
    context.subscriptions.push(vscode.commands.registerCommand('vscode-img-upload.delete', () => {
        let msg = "Hello VS Code";
        vscode.window.showInformationMessage(msg);
    }));
    context.subscriptions.push(vscode.languages.registerHoverProvider('markdown', {
        provideHover(document, position, token) {
            const textLine = document.lineAt(position.line);
            const res = (0, utils_1.matchUrl)(textLine.text);
            const fin = textLine.text.indexOf(res);
            const lin = textLine.text.lastIndexOf(res.substring(res.length - 1));
            if ((0, utils_1.matchUrl)(textLine.text) && position.character > fin && position.character < lin) {
                const commentCommandUri = vscode.Uri.parse(`command:vscode-img-upload.delete`);
                console.log(position, token, commentCommandUri, 1);
                const contents = new vscode.MarkdownString(`[测试](${commentCommandUri})`);
                contents.isTrusted = true;
                return new vscode.Hover(contents);
            }
        },
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map