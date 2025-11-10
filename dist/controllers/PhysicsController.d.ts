import Matter from "matter-js";
export declare class PhysicsController {
    static myInstance: PhysicsController;
    static get(): PhysicsController;
    get engine(): Matter.Engine;
    private _engine;
    private _debugRender;
    private _physicswalls;
    private _wallOptions;
    private wallThickness;
    Init(canvas: HTMLCanvasElement, physicsWalls: boolean | undefined, debugRenderDiv: HTMLDivElement, debug?: boolean): void;
    SetSize(width: number, height: number, dprIn?: number): void;
    AddBody(body: Matter.Body): void;
    Update(time: number, frameCount: number, onceSecond: boolean, onceMinute: boolean): void;
    private handleCollision;
    Dispose(): void;
}
