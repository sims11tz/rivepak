import { CanvasObj, CanvasObjectDef } from "./CanvasObj";
/**
 * Container object that can hold and manage child canvas objects.
 * All children inherit transformations from their parent container.
 */
export declare class CanvasContainerObj extends CanvasObj {
    children: CanvasObj[];
    private _childOriginalTransforms;
    private _visible;
    get visible(): boolean;
    set visible(value: boolean);
    constructor(canvasDef: CanvasObjectDef);
    protected InitContainer(): void;
    /**
     * Adds a child object to this container
     */
    AddChild(child: CanvasObj): void;
    /**
     * Removes a child object from this container
     */
    RemoveChild(child: CanvasObj): boolean;
    /**
     * Removes a child by its ID or label
     */
    RemoveChildById(id: string): boolean;
    /**
     * Gets a child by its ID or label
     */
    GetChildById(id: string): CanvasObj | null;
    /**
     * Gets all children of a specific type
     */
    GetChildrenByType<T extends CanvasObj>(type: new (...args: any[]) => T): T[];
    /**
     * Removes all children from this container
     */
    ClearChildren(): void;
    /**
     * Brings a child to the front (highest z-order)
     */
    BringChildToFront(child: CanvasObj): void;
    /**
     * Sends a child to the back (lowest z-order)
     */
    SendChildToBack(child: CanvasObj): void;
    /**
     * Updates z-order of all children based on their position in the array
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
    GetChildAtPoint(x: number, y: number): CanvasObj | null;
    /**
     * Updates container and all its children
     */
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    /**
     * Sets the position of the container
     */
    SetPosition(x: number, y: number): void;
    /**
     * Sets the scale of the container
     */
    SetScale(xScale: number, yScale?: number): void;
    /**
     * Moves a child to a new relative position within the container
     */
    MoveChild(child: CanvasObj, x: number, y: number): void;
    /**
     * Scales a child relative to the container
     */
    ScaleChild(child: CanvasObj, xScale: number, yScale?: number): void;
    /**
     * Disposes of the container and all its children
     */
    Dispose(): void;
    /**
     * Gets debug info about the container
     */
    GetDebugInfo(): string;
}
