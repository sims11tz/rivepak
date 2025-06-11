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
    get resolutionScale() { return this._resolutionScale; }
    get transformedWidth() { return this._transformedWidth; }
    get transformedHeight() { return this._transformedHeight; }
    get transformedX() { return this._transformedX; }
    get transformedY() { return this._transformedY; }
    constructor(defObj) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
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
        this.xScale = 0;
        this.yScale = 0;
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
        this._body = null;
        this._propertyChangeListeners = new Map();
        this._OnZIndexChanged = null;
        console.log("CanvasObj.constructor() -- defObj=", defObj);
        this._defObj = defObj;
        console.log("CanvasObj.constructor() -- defObj=", this.defObj);
        this._uuid = GlobalUIDGenerator.generateUID();
        this._label = (_a = this.defObj.label) !== null && _a !== void 0 ? _a : GlobalUIDGenerator.generateUniqueString(this.constructor.name);
        this._state = { x: (_b = defObj.x) !== null && _b !== void 0 ? _b : 0, y: (_c = defObj.y) !== null && _c !== void 0 ? _c : 0, z: (_d = defObj.z) !== null && _d !== void 0 ? _d : 0 };
        this.centerLocally = (_e = defObj.centerLocally) !== null && _e !== void 0 ? _e : false;
        this.centerGlobally = (_f = defObj.centerGlobally) !== null && _f !== void 0 ? _f : false;
        this.group = (_g = this.defObj.group) !== null && _g !== void 0 ? _g : "main";
        this.width = (_h = this.defObj.width) !== null && _h !== void 0 ? _h : 0;
        this.height = (_j = this.defObj.height) !== null && _j !== void 0 ? _j : 0;
        this.constrainProportions = (_k = this.defObj.constrainProportions) !== null && _k !== void 0 ? _k : false;
        this.xScale = (_l = this.defObj.xScale) !== null && _l !== void 0 ? _l : 0;
        this.yScale = (_m = this.defObj.yScale) !== null && _m !== void 0 ? _m : 0;
        this.baseX = (_o = defObj.x) !== null && _o !== void 0 ? _o : 0;
        this.baseY = (_p = defObj.y) !== null && _p !== void 0 ? _p : 0;
        this.baseWidth = (_q = defObj.width) !== null && _q !== void 0 ? _q : 1;
        this.baseHeight = (_r = defObj.height) !== null && _r !== void 0 ? _r : 1;
        this.baseXScale = (_s = defObj.xScale) !== null && _s !== void 0 ? _s : 1;
        this.baseYScale = (_t = defObj.yScale) !== null && _t !== void 0 ? _t : 1;
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
    set x(value) {
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
        console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% START ', this.defObj);
        this._propertyChangeListeners.clear();
        this._defObj = null;
        this._OnZIndexChanged = null;
        console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% END');
    }
}
