import * as fs from 'node:fs';
import { window, commands, Range, Position, Hover, Uri, MarkdownString } from 'vscode';

import { uploadImage, deleteImage } from './request';
import { isImage, getClipboardImages, genImageWith, genImagesWith } from './image';
import { getEventOpts, matchUrls, getHashPath, emptyDir, imagesDirPath, useStatusBar } from './utils';
import { COMMAND_UPLOAD_KEY, COMMAND_DELETE_KEY } from './constant';

import type { TextDocument, TextDocumentChangeEvent } from 'vscode';

type CommandUploadHandlerSetup = { imagePaths?: string[]; showLoading?: boolean; };
export function createOnCommandUploadHandler() {
    return async function(setup?: CommandUploadHandlerSetup) {
        const { show, hide } = useStatusBar();

        fs.access(imagesDirPath, fs.constants.F_OK, (err) => (err && fs.mkdirSync(imagesDirPath)));

        const setupImagePaths = setup && setup.imagePaths, setupShowLoading = (setup && setup.showLoading) ?? true;

        const inputImages = genImagesWith(setupImagePaths);

        const images = inputImages.length ? inputImages : await getClipboardImages();
        const outputUrls = [];
        
        for (const image of images) {
            setupShowLoading && show(`正在上传${image.fullName}...`);
            const hashPath = getHashPath(image);

            const url = matchUrls(await uploadImage(hashPath));
            url.length && outputUrls.push(url[0]) && (image.url = url[0]);
        }

        emptyDir(imagesDirPath);
        hide();

        return outputUrls;
    };
}

type CommandDeleteHandlerSetup = { url: string; position?: { line: number; startIndex: number; endIndex: number; }; };
export function createOnCommandDeleteHandler() {
    return async function(setup: CommandDeleteHandlerSetup) {
        const { show, hide } = useStatusBar();

        const image = genImageWith(setup.url);
        if (!image) { return; };

        show(`正在删除${image.fullName}`);
        const res = await deleteImage(image.fullName);
        hide();
        if (!res) { return; };
        if (!setup.position) { return; };

        const { line, startIndex, endIndex } = setup.position;

        window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.delete(new Range(new Position(line, startIndex), new Position(line, endIndex)));
        });
    };
}

export function createOnMarkdownHoverHandler() {
    return function(document: TextDocument, position: Position) {
        const textLine = document.lineAt(position.line);
        const matchedUrls = matchUrls(textLine.text);

        for (const url of matchedUrls) {
            const fin = textLine.text.indexOf(url);
            const lin = textLine.text.lastIndexOf(url.substring(url.length - 1));

            if (matchUrls(textLine.text).length && position.character > fin && position.character < lin) {
                const startIndex = textLine.text.substring(0, position.character).lastIndexOf("![");
                const endIndex = textLine.text.substring(position.character, textLine.text.length).indexOf(")") + position.character + 1;
                const delPosition = { line: position.line, startIndex, endIndex };
                const commentCommandUri = Uri.parse(
                    `command:${COMMAND_DELETE_KEY}?${encodeURIComponent(JSON.stringify({ url: url, position: delPosition }))}`
                );
                const contents = new MarkdownString(`[删除](${commentCommandUri})`);
                contents.isTrusted = true;
                return new Hover(contents);
            }
        }
    };
}

export function createOnDidChangeTextDocumentHandler() {
    let preText = "";
    let preOutputText = "";
    let prePosition: Position;
    return async function(event: TextDocumentChangeEvent) {
        const { text, range } = getEventOpts(event);

        // if not paste image
        if (!isImage(text) || preOutputText === text) { return; };
        // if recall
        if (preText === text && prePosition && range.start.isEqual(prePosition)) { return; };

        const outputUrls = await commands.executeCommand<string[]>(COMMAND_UPLOAD_KEY);

        if (!outputUrls.length) { return; };

        const outputText = outputUrls.map((item) => `![](${item})`).join("\n");

        const lineArr = text.split("\n");
        
        window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.delete(new Range(range.start, new Position(range.start.line + (lineArr.length - 1 === -1 ? 0 : lineArr.length -1), lineArr.length > 1 ? lineArr[lineArr.length - 1].length : range.start.character + lineArr[lineArr.length - 1].length)));
            editBuilder.insert(new Position(range.start.line, range.start.character), outputText);
        });

        preText = text;
        preOutputText = outputText;
        prePosition = new Position(range.start.line, range.start.character + outputText.length);
    };
}