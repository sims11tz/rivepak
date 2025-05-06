export class GlobalUIDGenerator {
    static generateUID() {
        return `obj_${++this.currentId}}`;
    }
    static generateUniqueString(baseString) {
        if (!this.uniqueIds[baseString]) {
            this.uniqueIds[baseString] = 1;
        }
        else {
            this.uniqueIds[baseString]++;
        }
        return `${baseString}_${this.uniqueIds[baseString]}`;
    }
    static clear() {
        this.currentId = 0;
        this.uniqueIds = {};
    }
}
GlobalUIDGenerator.currentId = 0;
GlobalUIDGenerator.uniqueIds = {};
export default class CanvasObj {
    get uuid() { return this._uuid; }
    get label() { return this._label; }
    get defObj() { return this._defObj; }
    constructor(defObj) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this._uuid = "";
        this._label = "";
        this._defObj = null;
        this.enabled = true;
        this.group = "main";
        this.width = 0;
        this.height = 0;
        this.xScale = 0;
        this.yScale = 0;
        this._body = null;
        this._propertyChangeListeners = new Map();
        this._onZIndexChanged = null;
        this._defObj = defObj;
        this._uuid = GlobalUIDGenerator.generateUID();
        this._label = (_a = this.defObj.label) !== null && _a !== void 0 ? _a : GlobalUIDGenerator.generateUniqueString(this.constructor.name);
        this._state = { x: (_b = defObj.x) !== null && _b !== void 0 ? _b : 0, y: (_c = defObj.y) !== null && _c !== void 0 ? _c : 0, z: (_d = defObj.z) !== null && _d !== void 0 ? _d : 0 };
        this.group = (_e = this.defObj.group) !== null && _e !== void 0 ? _e : "main";
        this.width = (_f = this.defObj.width) !== null && _f !== void 0 ? _f : 0;
        this.height = (_g = this.defObj.height) !== null && _g !== void 0 ? _g : 0;
        this.xScale = (_h = this.defObj.xScale) !== null && _h !== void 0 ? _h : 0;
        this.yScale = (_j = this.defObj.yScale) !== null && _j !== void 0 ? _j : 0;
        this._state = new Proxy(this._state, {
            set: (target, key, value) => {
                var _a;
                const oldValue = target[key];
                if (oldValue !== value) {
                    target[key] = value;
                    (_a = this._propertyChangeListeners.get(key)) === null || _a === void 0 ? void 0 : _a(oldValue, value);
                }
                return true;
            },
        });
    }
    get x() { return this._state.x; }
    set x(value) { this._state.x = value; }
    get y() { return this._state.y; }
    set y(value) { this._state.y = value; }
    get z() { return this._state.z; }
    set z(value) {
        var _a;
        if (this._state.z !== value) {
            const oldZ = this._state.z;
            this._state.z = value;
            (_a = this._onZIndexChanged) === null || _a === void 0 ? void 0 : _a.call(this, this, oldZ, this._state.z);
        }
    }
    swapDepths(other) {
        const temp = this.z;
        this.z = other.z;
        other.z = temp;
    }
    // ✅ Function to selectively bind to x, y, or z changes
    bindPropertyChange(property, callback) {
        this._propertyChangeListeners.set(property, callback);
    }
    // ✅ Function to unbind property change listener
    unbindPropertyChange(property) {
        this._propertyChangeListeners.delete(property);
    }
    set onZIndexChanged(func) {
        this._onZIndexChanged = func;
    }
}
