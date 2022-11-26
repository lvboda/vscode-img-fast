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

function genConfig(config: WorkspaceConfiguration) {
    return Object.entries(defaultConfig).reduce((pre, [key]) => {
        return { ...pre, [key]: config.get(key) };
    }, defaultConfig);
}

export function getConfig() {
    return genConfig(workspace.getConfiguration(PLUGIN_NAME));
}
