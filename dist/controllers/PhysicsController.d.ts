import Matter from "matter-js";
export declare class PhysicsController {
    static myInstance: PhysicsController;
    static get(): PhysicsController;
    get engine(): Matter.Engine;
    private _engine;
    private _debugRender;
    private _debugRenderDiv;
    private _physicswalls;
    private _wallOptions;
    private _logicalWidth;
    private _logicalHeight;
    private wallThickness;
    Init(canvas: HTMLCanvasElement, physicsWalls: boolean | undefined, debugRenderDiv: HTMLDivElement, debug?: boolean): void;
    SetSize(width: number, height: number, dprIn?: number): void;
    /**
     * Enable physics walls at canvas boundaries
     * Can be called at runtime to add walls dynamically
     */
    EnableWalls(): void;
    /**
     * Disable physics walls
     * Can be called at runtime to remove walls dynamically
     */
    DisableWalls(): void;
    /**
     * Check if physics walls are currently enabled
     */
    get wallsEnabled(): boolean;
    /**
     * Create boundary walls using current logical dimensions
     */
    private createWalls;
    /**
     * Remove all boundary walls from the physics world
     */
    private removeWalls;
    AddBody(body: Matter.Body): void;
    Update(time: number, frameCount: number, onceSecond: boolean, onceMinute: boolean): void;
    private handleCollision;
    Dispose(): void;
}
