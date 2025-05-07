import React from "react";
interface RiveCanvasContainerProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    pixiCanvasRef: React.RefObject<HTMLCanvasElement>;
    debugContainerRef: React.RefObject<HTMLDivElement>;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}
declare const RiveCanvasContainer: React.FC<RiveCanvasContainerProps>;
export default RiveCanvasContainer;
