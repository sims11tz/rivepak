/// <reference types="matter-js" />
import { Artboard } from "@rive-app/webgl-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { CanvasRiveObj } from "./CanvasRiveObj";
declare const BaseRivePhysicsObject_base: {
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
        _defObj: import("./CanvasObj").CanvasObjectDef | null;
        readonly defObj: import("./CanvasObj").CanvasObjectDef;
        enabled: boolean;
        _state: {
            x: number;
            y: number;
            z: number;
        };
        centerLocally: boolean;
        centerGlobally: boolean;
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
} & typeof CanvasRiveObj;
declare class BaseRivePhysicsObject extends BaseRivePhysicsObject_base {
}
export declare class RivePhysicsObject extends BaseRivePhysicsObject {
    constructor(riveDef: RiveObjectDef, artboard: Artboard);
    protected initRiveObject(): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
}
export {};
