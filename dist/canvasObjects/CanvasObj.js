export class GlobalUIDGenerator {
    static generateUID() {
        return `obj_${++this.currentId}`;
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
export class CanvasObj {
    get uuid() { return this._uuid; }
    get label() { return this._label; }
    get defObj() { return this._defObj; }
    constructor(defObj) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        this._uuid = "";
        this._label = "";
        this._defObj = null;
        this.enabled = true;
        this.centerLocally = false;
        this.centerGlobally = false;
        this.group = "main";
        this.width = 0;
        this.height = 0;
        this.xScale = 0;
        this.yScale = 0;
        this._body = null;
        this._propertyChangeListeners = new Map();
        this._OnZIndexChanged = null;
        this._defObj = defObj;
        this._uuid = GlobalUIDGenerator.generateUID();
        this._label = (_a = this.defObj.label) !== null && _a !== void 0 ? _a : GlobalUIDGenerator.generateUniqueString(this.constructor.name);
        this._state = { x: (_b = defObj.x) !== null && _b !== void 0 ? _b : 0, y: (_c = defObj.y) !== null && _c !== void 0 ? _c : 0, z: (_d = defObj.z) !== null && _d !== void 0 ? _d : 0 };
        this.centerLocally = (_e = defObj.centerLocally) !== null && _e !== void 0 ? _e : false;
        this.centerGlobally = (_f = defObj.centerGlobally) !== null && _f !== void 0 ? _f : false;
        this.group = (_g = this.defObj.group) !== null && _g !== void 0 ? _g : "main";
        this.width = (_h = this.defObj.width) !== null && _h !== void 0 ? _h : 0;
        this.height = (_j = this.defObj.height) !== null && _j !== void 0 ? _j : 0;
        this.xScale = (_k = this.defObj.xScale) !== null && _k !== void 0 ? _k : 0;
        this.yScale = (_l = this.defObj.yScale) !== null && _l !== void 0 ? _l : 0;
        this.baseX = (_m = defObj.x) !== null && _m !== void 0 ? _m : 0;
        this.baseY = (_o = defObj.y) !== null && _o !== void 0 ? _o : 0;
        this.baseWidth = (_p = defObj.width) !== null && _p !== void 0 ? _p : 1;
        this.baseHeight = (_q = defObj.height) !== null && _q !== void 0 ? _q : 1;
        this.baseXScale = (_r = defObj.xScale) !== null && _r !== void 0 ? _r : 1;
        this.baseYScale = (_s = defObj.yScale) !== null && _s !== void 0 ? _s : 1;
        //console.log("CanvasObj["+this._uuid+"]   pos=<"+this.baseX+","+this.baseY+">  size=<"+this.width+","+this.height+">  scale=<"+this.baseXScale+","+this.baseYScale+"> ");
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
    UpdateBaseProps() {
        this.baseX = this._state.x;
        this.baseY = this._state.y;
        this.baseWidth = this.width;
        this.baseHeight = this.height;
        this.baseXScale = this.xScale;
        this.baseYScale = this.yScale;
        //console.log("CanvasObj["+this._uuid+"]   pos=<"+this.baseX+","+this.baseY+">  size=<"+this.width+","+this.height+">  scale=<"+this.baseXScale+","+this.baseYScale+"> ");
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
            (_a = this._OnZIndexChanged) === null || _a === void 0 ? void 0 : _a.call(this, this, oldZ, this._state.z);
        }
    }
    ApplyResolutionScale(scale) {
        //console.log("ApplyResolutionScale["+this._uuid+"]", scale);
        //console.log("ApplyResolutionScale["+this._uuid+"]  PRE = ", this.x, this.y, this.width, this.height);
        // Optional: recompute width/height if used elsewhere
        //this.width = this.baseWidth * (this.baseXScale * scale);
        //this.height = this.baseHeight * (this.baseYScale * scale);
        /*************************** */
        //this.xScale = this.baseXScale * scale;
        //this.yScale = this.baseYScale * scale;
        //// Optional: recompute width/height if used elsewhere
        //this.width = this.baseWidth * this.xScale;
        //this.height = this.baseHeight * this.yScale;
        /*************************** */
        //this.x = this.baseX * scale;
        //this.y = this.baseY * scale;
        //this.xScale = this.baseXScale * scale;
        //this.yScale = this.baseYScale * scale;
        //// 👇 FIX: Don't apply scale twice!
        //this.width = this.baseWidth * this.baseXScale * scale;
        //this.height = this.baseHeight * this.baseYScale * scale;
        //console.log("ApplyResolutionScale["+this._uuid+"] POST = ", this.x, this.y, this.width, this.height);
    }
    SwapDepths(other) {
        const temp = this.z;
        this.z = other.z;
        other.z = temp;
    }
    // ✅ Function to selectively bind to x, y, or z changes
    BindPropertyChange(property, callback) {
        this._propertyChangeListeners.set(property, callback);
    }
    // ✅ Function to unbind property change listener
    UnbindPropertyChange(property) {
        this._propertyChangeListeners.delete(property);
    }
    set OnZIndexChanged(func) {
        this._OnZIndexChanged = func;
    }
    Dispose() {
        this._propertyChangeListeners.clear();
        this._defObj = null;
        this._OnZIndexChanged = null;
    }
}
