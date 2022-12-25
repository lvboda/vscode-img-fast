import { window, MarkdownString } from 'vscode';

import { PLUGIN_NAME } from './constant';

function genMessage(message: string) {
    return `[ ${PLUGIN_NAME} ] ${message}`;
}

const globalStatusBar = window.createStatusBarItem();

export function showStatusBar(message: string, tooltip?: string) {
    globalStatusBar.tooltip = new MarkdownString(tooltip);
    globalStatusBar.text = genMessage(message);
    globalStatusBar.show();
}

export function hideStatusBar() {
    globalStatusBar.hide();
}

export function showMessage(type: "info" | "warn" | "error" = "info", message: string, ...args: string[]) {
    switch (type) {
        case "info":
            window.showInformationMessage(genMessage(message), ...args);
            break;
        case "warn":
            window.showWarningMessage(genMessage(message), ...args);
            break;
        case "error":
            window.showErrorMessage(genMessage(message), ...args);
            break;
    }
}