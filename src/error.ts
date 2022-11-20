export const currentInvokeErrorQueue = new class CurrentInvokeErrorQueue {
    private queue = new Set<Error>();

    forEach(cb: (value: Error, value2: Error, set: Set<Error>) => void, thisArg?: any) {
        this.queue.forEach(cb, thisArg);
    }

    get() {
        return Array.from(this.queue);
    }

    push(error: any) {
        this.queue.add(new Error(error));
    }

    isEmpty() {
        return this.queue.size === 0;
    }

    clear() {
        this.queue.clear();
    }
};

export function invokeWithErrorHandler<T extends (...args: any[]) => any>(cb: T) {
    return async function(...args: Parameters<T>): Promise<ReturnType<T>> {
        currentInvokeErrorQueue.clear();
        let res;
        try {
            res = await cb(...args);
        } catch(error) {
            currentInvokeErrorQueue.push(error);
        }
        return res;
    };
}

export function invokeWithErrorHandlerSync<T extends (...args: any[]) => any>(cb: T) {
    return function(...args: Parameters<T>): ReturnType<T> {
        currentInvokeErrorQueue.clear();
        let res;
        try {
            res = cb(...args);
        } catch(error) {
            currentInvokeErrorQueue.push(error);
        }
        return res;
    };
}

export function panic(error: any, cb?: (error: any) => any) {
    currentInvokeErrorQueue.push(error);
    cb?.(error);
}