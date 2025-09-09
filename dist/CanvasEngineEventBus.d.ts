import { ResizeCanvasObj } from "./useCanvasEngine";
type Listener<T> = (data: T) => void;
declare class PubSub<T> {
    private listeners;
    Subscribe(listener: Listener<T>): () => boolean;
    Publish(data: T): void;
    Clear(): void;
    UnsubscribeAll(): void;
}
export declare const CanvasEngineResizePubSub: PubSub<ResizeCanvasObj>;
export declare const CanvasEngineStartResizePubSub: PubSub<unknown>;
export {};
