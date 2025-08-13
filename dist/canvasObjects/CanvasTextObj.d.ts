import * as PIXI from "pixi.js";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./CanvasObj";
export declare class CanvasTextObject extends CanvasPixiShapeObj {
    private _textField;
    private _typewriterIndex;
    private _typewriterTimer;
    private _fullText;
    private _fadeStartTime;
    private _pulseTime;
    private _alignmentOffsetX;
    private _alignmentOffsetY;
    constructor(canvasDef: CanvasObjectDef);
    InitPixiObject(): void;
    /**
     * Migrates old PIXI v7 stroke format to v8 format
     */
    private migrateStrokeStyle;
    private createTextStyle;
    private calculateAlignmentOffsets;
    DrawVectors(): void;
    private updateTextTransform;
    private getCurrentDisplayText;
    private hasStyleChanged;
    SetText(text: string): void;
    SetTextStyle(style: Partial<PIXI.TextStyleOptions>): void;
    SetAlignment(horizontal?: 'left' | 'center' | 'right' | 'justify', vertical?: 'top' | 'middle' | 'bottom'): void;
    StartTypewriter(speed?: number): void;
    StopTypewriter(): void;
    private onTextClick;
    private onTextHover;
    private onTextHoverOut;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
