class PubSub {
    constructor() {
        this.listeners = new Set();
    }
    Subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    Publish(data) {
        for (const listener of this.listeners) {
            listener(data);
        }
    }
    Clear() {
        this.listeners.clear();
    }
    UnsubscribeAll() {
        this.Clear();
    }
}
export const CanvasEngineResizePubSub = new PubSub();
export const CanvasEngineStartResizePubSub = new PubSub();
/**
 * Generic event bus for UI components
 */
export class CanvasEngineEventBus {
    static on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(handler);
    }
    static off(event, handler) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(handler);
        }
    }
    static emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(handler => handler(data));
        }
    }
    static clear(event) {
        if (event) {
            this.listeners.delete(event);
        }
        else {
            this.listeners.clear();
        }
    }
}
CanvasEngineEventBus.listeners = new Map();
