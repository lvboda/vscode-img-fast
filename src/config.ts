import { workspace } from "vscode";

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
        if (!config.has(key)) {
            throw Error(`<configuration error> not ${key} in setting.`);
        }
        return { ...pre, [key]: config.get(key) };
    }, defaultConfig);
}

export function getConfig() {
    if (!config) {
        config = genConfig(workspace.getConfiguration(PLUGIN_NAME));
    }
    return config;
}
