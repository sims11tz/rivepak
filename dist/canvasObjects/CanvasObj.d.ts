import Matter from "matter-js";
export declare class GlobalUIDGenerator {
    private static currentId;
    static generateUID(): string;
    private static uniqueIds;
    static generateUniqueString(baseString: string): string;
    static clear(): void;
}
export interface CanvasObjectEntity {
    width?: number;
    height?: number;
    xScale?: number;
    yScale?: number;
    xSpeed?: number;
    x?: number;
    y?: number;
    z?: number;
    riveInteractiveLocalOnly?: boolean;
}
export interface CanvasObjectDef {
    uuid?: string;
    label?: string;
    count?: number;
    width?: number;
    height?: number;
    xScale?: number;
    yScale?: number;
    x?: number;
    y?: number;
    z?: number;
    group?: string;
    randomSpeed?: boolean;
    xSpeed?: number;
    ySpeed?: number;
    interactive?: boolean;
    riveInteractive?: boolean;
    riveInteractiveLocalOnly?: boolean;
}
export declare abstract class CanvasObj {
    abstract update(time: number, frameCount: number, onceSecond: boolean): void;
    dispose(): void;
    _uuid: string;
    get uuid(): string;
    _label: string;
    get label(): string;
    _defObj: CanvasObjectDef | null;
    get defObj(): CanvasObjectDef;
    enabled: boolean;
    _state: {
        x: number;
        y: number;
        z: number;
    };
    group: string;
    width: number;
    height: number;
    xScale: number;
    yScale: number;
    _body: Matter.Body | null;
    _propertyChangeListeners: Map<"x" | "y" | "z", (oldValue: number, newValue: number) => void>;
    constructor(defObj: CanvasObjectDef);
    get x(): number;
    set x(value: number);
    get y(): number;
    set y(value: number);
    get z(): number;
    set z(value: number);
    swapDepths(other: CanvasObj): void;
    bindPropertyChange(property: "x" | "y" | "z", callback: (oldValue: number, newValue: number) => void): void;
    unbindPropertyChange(property: "x" | "y" | "z"): void;
    set onZIndexChanged(func: ((canvasObj: CanvasObj, oldZIndex: number, newZIndex: number) => void) | null);
    _onZIndexChanged: ((canvasObj: CanvasObj, oldZIndex: number, newZIndex: number) => void) | null;
}
