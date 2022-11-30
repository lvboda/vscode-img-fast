import { workspace } from "vscode";

import { PLUGIN_NAME } from "./constant";

import type { WorkspaceConfiguration } from "vscode";

const defaultConfig = {
    openPasteAutoUpload: true,
    openDeleteHover: true,
    authorization: "",
    imgRename: "${hash}-${yyyy}-${MM}-${dd}-${hh}-${mm}-${ss}-${timestamp}-${name}",
    outputRename: "![${name}](${url})",
    uploadUrl: "",
    uploadMethod: "POST",
    uploadFormDataKey: "",
    uploadedKey: "",
    deleteUrl: "",
    deleteMethod: "DELETE",
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
