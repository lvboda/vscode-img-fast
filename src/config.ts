import { workspace } from "vscode";

import localize from './localize';
import { PLUGIN_NAME } from "./constant";

import type { WorkspaceConfiguration } from "vscode";

const defaultConfig = {
    openPasteAutoUpload: true,
    authorization: "",
    imgRename: "",
    outputRename: "",
    uploadUrl: "",
    uploadMethod: "",
    uploadFormDataKey: "",
    deleteUrl: "",
    deleteMethod: "",
    deleteQueryKey: "",
    deletedFlag: "layout",
};

let config: typeof defaultConfig | null = null;

function genConfig(config: WorkspaceConfiguration) {
    return Object.entries(defaultConfig).reduce((pre, [key]) => {
        if (["imgRename", "outputRename", "uploadUrl", "uploadMethod", "uploadFormDataKey"].includes(key)) throw Error(`${key} ${localize("config.notNull")}`);
        return { ...pre, [key]: config.get(key) };
    }, defaultConfig);
}

export function getConfig() {
    if (!config) {
        config = genConfig(workspace.getConfiguration(PLUGIN_NAME));
    }
    return config;
}
