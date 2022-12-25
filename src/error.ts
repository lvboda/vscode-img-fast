import localize from './localize';
import { showMessage } from './tips';
import { REPOSITORY_URL } from './constant';

export function invokeWithErrorHandler<T extends (...args: any[]) => any>(cb: T) {
    return async function (...args: Parameters<T>): Promise<ReturnType<T>> {
        let res;
        try {
            res = await cb(...args);
        } catch (err: any) {
            panic(err);
        }
        return res;
    };
}

export function invokeWithErrorHandlerSync<T extends (...args: any[]) => any>(cb: T) {
    return function (...args: Parameters<T>): ReturnType<T> {
        let res;
        try {
            res = cb(...args);
        } catch (err: any) {
            panic(err);
        }
        return res;
    };
}

export function panic(error: Error, cb?: (error: Error) => any) {
    const msg = `${error} [${localize("error.feedback")}](${REPOSITORY_URL}/issues/new?title=${encodeURIComponent(error.toString().replace(/\(|\)|\[|\]/g, " "))})`;
    !cb && showMessage("error", msg, localize("error.close"));
    cb?.(error);
}