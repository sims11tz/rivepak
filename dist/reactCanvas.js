import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const toggleRunState = () => {
    console.log("TOGGLE RUN STATE PLEASE ! ");
    //window.dispatchEvent(new CustomEvent(CUSTOM_CLIENT_EVENTS.CANVAS_ENGINE_TOGGLE_RUN_STATE_EVENT, { }));
};
const RiveCanvasContainer = ({ canvasRef, pixiCanvasRef, debugContainerRef, children, style = {}, className = "", }) => {
    return (_jsxs("div", { children: [_jsxs("div", Object.assign({ id: "debugTools", className: "debugTools" }, { children: [_jsx("button", Object.assign({ onClick: toggleRunState }, { children: _jsx("span", { id: "runStateLabel" }) })), _jsxs("div", Object.assign({ className: "fpsContainer" }, { children: [_jsx("span", { className: "fpsSpinner", id: "fpsSpinner" }), _jsx("span", { id: "fps" })] }))] })), _jsxs("div", Object.assign({ style: Object.assign({ position: "relative" }, style), className: className }, { children: [_jsx("canvas", { id: "riveCanvas", ref: canvasRef, style: { border: "1px solid black" } }), _jsx("div", Object.assign({ id: "pixiCanvasContainer", style: { position: "absolute", top: 0, left: 0, zIndex: 2 } }, { children: _jsx("canvas", { id: "pixiCanvas", ref: pixiCanvasRef }) })), _jsx("div", { ref: debugContainerRef, style: {
                            position: "absolute",
                            top: 0,
                            left: 0,
                            pointerEvents: "none",
                            opacity: 0.25,
                        } }), children] }))] }));
};
export default RiveCanvasContainer;
