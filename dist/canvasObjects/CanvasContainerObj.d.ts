import { BaseCanvasObj, CanvasObjectDef } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
export declare class CanvasContainerObj extends BaseCanvasObj {
    children: BaseCanvasObj[];
    private _childOriginalTransforms;
    get visible(): boolean;
    set visible(value: boolean);
    constructor(canvasDef: CanvasObjectDef);
    protected _debugGraphics: PIXI.Graphics | null;
    private _needsDebugGraphics;
    protected InitContainer(): void;
    private initDebugGraphics;
    private destroyDebugGraphics;
    OnParentAdded(): void;
    OnParentRemoved(): void;
    protected DrawDebug(): void;
    /**
     * Adds a child object to this container
     */
    AddChild(child: BaseCanvasObj): void;
    /**
     * Removes a child object from this container
     */
    RemoveChild(child: BaseCanvasObj): boolean;
    /**
     * Removes a child by its ID or label
     */
    RemoveChildById(id: string): boolean;
    /**
     * Gets a child by its ID or label
     */
    GetChildById(id: string): BaseCanvasObj | null;
    GetChildrenByType<T extends BaseCanvasObj>(type: new (...args: any[]) => T): T[];
    /**
     * Removes all children from this container
     */
    ClearChildren(): void;
    /**
     * Brings a child to the front (highest z-order)
     */
    BringChildToFront(child: BaseCanvasObj): void;
    /**
     * Sends a child to the back (lowest z-order)
     */
    SendChildToBack(child: BaseCanvasObj): void;
    /**
     * Updates z-order of all children based on their position in the array
     * Uses fractional offsets to avoid polluting the global z-index space
     */
    private updateChildrenZOrder;
    /**
     * Updates a child's transform based on container's transform
     */
    private updateChildTransform;
    /**
     * Gets the world position of this container (accounting for nested containers)
     */
    GetWorldPosition(): {
        x: number;
        y: number;
    };
    /**
     * Gets the world scale of this container (accounting for nested containers)
     */
    GetWorldScale(): {
        xScale: number;
        yScale: number;
    };
    /**
     * Checks if a point is within this container's bounds
     */
    ContainsPoint(x: number, y: number): boolean;
    /**
     * Gets a child at a specific point (useful for hit testing)
     */
    GetChildAtPoint(x: number, y: number): BaseCanvasObj | null;
    /**
     * Updates container and all its children
     */
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    /**
     * Sets the position of the container

    public SetPosition(x: number, y: number): void
    {
        this.x = x;
        this.y = y;
    }

    /**
     * Sets the scale of the container

    public SetScale(xScale: number, yScale?: number): void
    {
        this.xScale = xScale;
        this.yScale = yScale ?? xScale;
    }

    /**
     * Moves a child to a new relative position within the container

    public MoveChild(child: CanvasObj, x: number, y: number): void
    {
        // Set the child's position relative to the container
        child.x = this.x + x;
        child.y = this.y + y;
    }

    public ScaleChild(child: CanvasObj, xScale: number, yScale?: number): void
    {
        // Set the child's scale relative to the container
        child.xScale = this.xScale * xScale;
        child.yScale = this.yScale * (yScale ?? xScale);
    }
    */
    Dispose(): void;
    /**
     * Gets debug info about the container
     */
    GetDebugInfo(): string;
}
