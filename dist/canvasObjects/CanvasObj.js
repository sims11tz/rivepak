export class GlobalUIDGenerator {
    static generateUID() { return `obj_${++this.currentId}`; }
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
    get id() { return (this._id != '') ? this._id : this._uuid; }
    get label() { return this._label; }
    get defObj() { return this._defObj; }
    SetParent(parent) { this._parent = parent; }
    get parent() { return this._parent; }
    get resolutionScale() { return this._resolutionScale; }
    get transformedWidth() { return this._transformedWidth; }
    get transformedHeight() { return this._transformedHeight; }
    get transformedX() { return this._transformedX; }
    get transformedY() { return this._transformedY; }
    constructor(defObj) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
        this._uuid = "";
        this._id = "";
        this._label = "";
        this._defObj = null;
        this.enabled = true;
        this.centerLocally = false;
        this.centerGlobally = false;
        this.group = "main";
        this.width = 0;
        this.height = 0;
        this._parent = null;
        // Store world coordinates separately for rendering (calculated by parent)
        this._worldX = 0;
        this._worldY = 0;
        this._worldXScale = 1;
        this._worldYScale = 1;
        this.constrainProportions = false;
        this._resolutionScale = -1;
        this._transformedWidth = -1;
        this._transformedWidthlast = -1;
        this._transformedHeight = -1;
        this._transformedHeightlast = -1;
        this._transformedX = -1;
        this._transformedXlast = -1;
        this._transformedY = -1;
        this._transformedYlast = -1;
        this._objBoundsReuse = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        this._body = null;
        this._propertyChangeListeners = new Map();
        this._OnZIndexChanged = null;
        this._debug = (_a = defObj.debugMode) !== null && _a !== void 0 ? _a : false;
        this._debugLogs = (_b = defObj.debugLogs) !== null && _b !== void 0 ? _b : false;
        this._defObj = defObj;
        this._uuid = GlobalUIDGenerator.generateUID();
        this._label = (_c = this.defObj.label) !== null && _c !== void 0 ? _c : GlobalUIDGenerator.generateUniqueString(this.constructor.name);
        this._state = { x: (_d = defObj.x) !== null && _d !== void 0 ? _d : 0, y: (_e = defObj.y) !== null && _e !== void 0 ? _e : 0, z: (_f = defObj.z) !== null && _f !== void 0 ? _f : 0, xScale: (_g = defObj.xScale) !== null && _g !== void 0 ? _g : 1, yScale: (_h = defObj.yScale) !== null && _h !== void 0 ? _h : 1 };
        this.centerLocally = (_j = defObj.centerLocally) !== null && _j !== void 0 ? _j : false;
        this.centerGlobally = (_k = defObj.centerGlobally) !== null && _k !== void 0 ? _k : false;
        this.group = (_l = this.defObj.group) !== null && _l !== void 0 ? _l : "main";
        this.width = (_m = this.defObj.width) !== null && _m !== void 0 ? _m : 0;
        this.height = (_o = this.defObj.height) !== null && _o !== void 0 ? _o : 0;
        this.constrainProportions = (_p = this.defObj.constrainProportions) !== null && _p !== void 0 ? _p : false;
        this.baseX = (_q = defObj.x) !== null && _q !== void 0 ? _q : 0;
        this.baseY = (_r = defObj.y) !== null && _r !== void 0 ? _r : 0;
        this.baseWidth = (_s = defObj.width) !== null && _s !== void 0 ? _s : 1;
        this.baseHeight = (_t = defObj.height) !== null && _t !== void 0 ? _t : 1;
        this.baseXScale = (_u = defObj.xScale) !== null && _u !== void 0 ? _u : 1;
        this.baseYScale = (_v = defObj.yScale) !== null && _v !== void 0 ? _v : 1;
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
        this.baseXScale = this._state.xScale;
        this.baseYScale = this._state.yScale;
        //console.log("CanvasObj["+this._uuid+"]   pos=<"+this.baseX+","+this.baseY+">  size=<"+this.width+","+this.height+">  scale=<"+this.baseXScale+","+this.baseYScale+"> ");
    }
    get x() { return this._state.x; }
    set x(value) {
        if (value == this._state.x)
            return;
        //console.log('__CanvasObj['+this._uuid+']  set x='+value);
        this._state.x = value;
        if (this._resolutionScale !== -1)
            this.ApplyResolutionScale(this._resolutionScale, "x");
    }
    get y() { return this._state.y; }
    set y(value) {
        this._state.y = value;
        if (this._resolutionScale !== -1)
            this.ApplyResolutionScale(this._resolutionScale, "y");
    }
    get z() { return this._state.z; }
    set z(value) {
        var _a;
        if (this._state.z !== value) {
            const oldZ = this._state.z;
            this._state.z = value;
            (_a = this._OnZIndexChanged) === null || _a === void 0 ? void 0 : _a.call(this, this, oldZ, this._state.z);
        }
    }
    get xScale() { return this._state.xScale; }
    set xScale(value) {
        this._state.xScale = value;
        if (this._resolutionScale !== -1)
            this.ApplyResolutionScale(this._resolutionScale, "xScale");
    }
    get yScale() { return this._state.yScale; }
    set yScale(value) {
        this._state.yScale = value;
        if (this._resolutionScale !== -1)
            this.ApplyResolutionScale(this._resolutionScale, "yScale");
    }
    // Get coordinates for rendering (automatically uses world coords when parented)
    get renderX() {
        // If parented, return the world position calculated by parent
        // Otherwise, return our own position
        return this._parent ? this._worldX : this._state.x;
    }
    get renderY() {
        return this._parent ? this._worldY : this._state.y;
    }
    get renderXScale() {
        return this._parent ? this._worldXScale : this._state.xScale;
    }
    get renderYScale() {
        return this._parent ? this._worldYScale : this._state.yScale;
    }
    InitVisuals() {
    }
    ApplyResolutionScale(scale, property = "") {
        //console.log(''+this.label+' ApplyResolutionScale() scale='+scale+', property='+property);
        if (scale !== this._resolutionScale) {
            //console.log(""+this.label+"  1 * "+scale+" ");
            property = "*";
            this._resolutionScale = scale;
        }
        else {
            //console.log(""+this.label+"  2 ! "+scale+" ");
        }
        //console.log(""+this.label+"  3 prop="+property+" ");
        if ((property == "*") || (property == "x" && this._transformedXlast != this.x)) {
            this._transformedX = this.x * scale;
            this._transformedXlast = this.x;
            //console.log(""+this.label+"APRS  4 x "+this.x+"--"+this._transformedX);
        }
        if ((property == "*") || (property == "y" && this._transformedYlast != this.y)) {
            this._transformedY = this.y * scale;
            this._transformedYlast = this.y;
            //console.log(""+this.label+"APRS  5 y "+this.y+"--"+this._transformedY);
        }
        if ((property == "*") || (property == "width" && this._transformedWidthlast != this.width)) {
            this._transformedWidth = this.width * scale;
            this._transformedWidthlast = this.width;
            //console.log(""+this.label+"APRS  6 width "+this.width+"--TransW:"+this._transformedWidth);
        }
        if ((property == "*") || (property == "height" && this._transformedHeightlast != this.height)) {
            this._transformedHeight = this.height * scale;
            this._transformedHeightlast = this.height;
            //console.log(""+this.label+"APRS  7 height "+this.height+"--TransH:"+this._transformedHeight);
        }
        // Scale changes affect width/height so trigger their updates when scale changes
        if ((property == "*") || (property == "xScale")) {
            this._transformedWidth = this.width * scale;
            this._transformedWidthlast = this.width;
        }
        if ((property == "*") || (property == "yScale")) {
            this._transformedHeight = this.height * scale;
            this._transformedHeightlast = this.height;
        }
    }
    SwapDepths(other) {
        const temp = this.z;
        this.z = other.z;
        other.z = temp;
    }
    BindPropertyChange(property, callback) {
        this._propertyChangeListeners.set(property, callback);
    }
    UnbindPropertyChange(property) {
        this._propertyChangeListeners.delete(property);
    }
    set OnZIndexChanged(func) {
        this._OnZIndexChanged = func;
    }
    Dispose() {
        //console.log("Disposing CanvasObj: "+this._uuid+" / "+this._label);
        this._propertyChangeListeners.clear();
        this._parent = null;
        this._defObj = null;
        this._OnZIndexChanged = null;
        if (this._body) {
            this._body = null;
        }
    }
}
