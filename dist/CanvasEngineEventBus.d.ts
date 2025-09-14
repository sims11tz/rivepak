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
/**
 * Generic event bus for UI components
 */
export declare class CanvasEngineEventBus {
    private static listeners;
    static on(event: string, handler: (data: any) => void): void;
    static off(event: string, handler: (data: any) => void): void;
    static emit(event: string, data: any): void;
    static clear(event?: string): void;
}
export {};
