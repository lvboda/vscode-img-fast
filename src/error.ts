class CurrentInvokeErrorQueue {
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
}

export const currentInvokeErrorQueue = new CurrentInvokeErrorQueue();

export async function invokeWithErrorHandler(cb: () => any): Promise<any> {
    currentInvokeErrorQueue.clear();
    let res: any;
    try {
       res = await cb();
    } catch(error) {
        currentInvokeErrorQueue.push(error);
    }
    return res;
}

export function panic(error: any) {
    currentInvokeErrorQueue.push(error);
}