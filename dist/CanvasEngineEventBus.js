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
