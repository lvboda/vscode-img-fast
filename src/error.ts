import { window } from 'vscode';

export function invokeWithErrorHandler<T extends (...args: any[]) => any>(cb: T) {
    return async function(...args: Parameters<T>): Promise<ReturnType<T>> {
        let res;
        try {
            res = await cb(...args);
        } catch(err) { panic(err); };
        return res;
    };
}

export function invokeWithErrorHandlerSync<T extends (...args: any[]) => any>(cb: T) {
    return function(...args: Parameters<T>): ReturnType<T> {
        let res;
        try {
            res = cb(...args);
        } catch(err) { panic(err); };
        return res;
    };
}

export function panic(error: any, cb?: (error: any) => any) {
    !cb && window.showErrorMessage(`[ img-upload ] ${error}`);
    cb?.(error);
}