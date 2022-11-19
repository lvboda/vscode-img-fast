"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.panic = exports.invokeWithErrorHandler = exports.currentInvokeErrorQueue = void 0;
class CurrentInvokeErrorQueue {
    constructor() {
        this.queue = new Set();
    }
    forEach(cb, thisArg) {
        this.queue.forEach(cb, thisArg);
    }
    get() {
        return Array.from(this.queue);
    }
    push(error) {
        this.queue.add(new Error(error));
    }
    isEmpty() {
        return this.queue.size === 0;
    }
    clear() {
        this.queue.clear();
    }
}
exports.currentInvokeErrorQueue = new CurrentInvokeErrorQueue();
async function invokeWithErrorHandler(cb) {
    exports.currentInvokeErrorQueue.clear();
    let res;
    try {
        res = await cb();
    }
    catch (error) {
        exports.currentInvokeErrorQueue.push(error);
    }
    return res;
}
exports.invokeWithErrorHandler = invokeWithErrorHandler;
function panic(error) {
    exports.currentInvokeErrorQueue.push(error);
}
exports.panic = panic;
//# sourceMappingURL=error.js.map