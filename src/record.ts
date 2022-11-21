import { window, MarkdownString } from 'vscode';

const globalStatusBar = window.createStatusBarItem();
export function showStatusBar(text: string, tooltip?: string) {
    globalStatusBar.tooltip = new MarkdownString(tooltip);
    globalStatusBar.text = text;
    globalStatusBar.show();
}

export function hideStatusBar() {
    globalStatusBar.hide();
}