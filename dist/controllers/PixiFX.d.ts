import { CanvasRiveObj } from '../canvasObjects/CanvasRiveObj';
export declare enum FXType {
    DAMAGE = "damage",
    HEAL = "heal",
    BUFF = "buff"
}
export declare class PixiFX {
    private static _flashColorMap;
    static Flash(target: CanvasRiveObj, color?: number, duration?: number, alpha?: number): void;
    static Shake(target: CanvasRiveObj, duration?: number, strength?: number): void;
    static Pulse(target: CanvasRiveObj, duration?: number, scaleFactor?: number): void;
    static ParticleBurst(target: CanvasRiveObj, color?: number, count?: number): void;
    static HitFeedback(target: CanvasRiveObj, type?: FXType): void;
    static DamageFlash(target: CanvasRiveObj): void;
}
