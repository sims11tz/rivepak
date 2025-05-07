import Matter from "matter-js";
export declare class PhysicsController {
    static myInstance: PhysicsController;
    static get(): PhysicsController;
    get engine(): Matter.Engine;
    private _engine;
    private _debugRender;
    init(canvas: HTMLCanvasElement, debugRenderDiv: HTMLDivElement, debug?: boolean): void;
    addBody(body: Matter.Body): void;
    update(time: number, frameCount: number, onceSecond: boolean): void;
    private handleCollision;
    dispose(): void;
}
