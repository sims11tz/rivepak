import Matter from "matter-js";
export declare class PhysicsController {
    static myInstance: PhysicsController;
    static get(): PhysicsController;
    get engine(): Matter.Engine;
    private _engine;
    private _debugRender;
    Init(canvas: HTMLCanvasElement, physicsWalls: boolean | undefined, debugRenderDiv: HTMLDivElement, debug?: boolean): void;
    AddBody(body: Matter.Body): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    private handleCollision;
    Dispose(): void;
}
