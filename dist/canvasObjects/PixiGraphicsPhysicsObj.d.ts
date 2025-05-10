/// <reference types="matter-js" />
import { CanvasObjectDef } from "./CanvasObj";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
declare const BaseShapePhysicsObj_base: {
    new (...args: any[]): {
        _body: import("matter-js").Body | null;
        InitPhysics(): void;
        UpdatePhysics(time: number, frameCount: number, onceSecond: boolean): void;
        Update(time: number, frameCount: number, onceSecond: boolean): void;
        OnCollision(other: import("./CanvasObj").CanvasObj, impactForce: number): void;
        Dispose(): void;
        _uuid: string;
        readonly uuid: string;
        _label: string;
        readonly label: string;
        _defObj: CanvasObjectDef | null;
        readonly defObj: CanvasObjectDef;
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
        baseX: number;
        baseY: number;
        baseWidth: number;
        baseHeight: number;
        baseXScale: number;
        baseYScale: number;
        _propertyChangeListeners: Map<"x" | "y" | "z", (oldValue: number, newValue: number) => void>;
        UpdateBaseProps(): void;
        x: number;
        y: number;
        z: number;
        ApplyResolutionScale(scale: number): void;
        SwapDepths(other: import("./CanvasObj").CanvasObj): void;
        BindPropertyChange(property: "x" | "y" | "z", callback: (oldValue: number, newValue: number) => void): void;
        UnbindPropertyChange(property: "x" | "y" | "z"): void;
        OnZIndexChanged: ((canvasObj: import("./CanvasObj").CanvasObj, oldZIndex: number, newZIndex: number) => void) | null;
        _OnZIndexChanged: ((canvasObj: import("./CanvasObj").CanvasObj, oldZIndex: number, newZIndex: number) => void) | null;
    };
} & typeof CanvasPixiShapeObj;
declare class BaseShapePhysicsObj extends BaseShapePhysicsObj_base {
}
export declare class PixiShapePhysicsObj extends BaseShapePhysicsObj {
    constructor(canvasDef: CanvasObjectDef);
    update(time: number, frameCount: number, onceSecond: boolean): void;
    dispose(): void;
}
export {};
