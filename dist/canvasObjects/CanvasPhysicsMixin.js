import Matter from "matter-js";
import { PhysicsController } from "../controllers/PhysicsController";
export function CanvasPhysicsMixin(Base) {
    return class extends Base {
        constructor() {
            super(...arguments);
            this._body = null;
            this._resolutionScaleMixLast = -1;
            this._transformedMixWidthlast = -1;
            this._transformedMixHeightlast = -1;
            this._transformedMixXlast = -1;
            this._transformedMixYlast = -1;
            this._EPSILON = 0.0001;
        }
        InitPhysics() {
            var _a, _b, _c, _d;
            console.log('%c CanvasPhysicsMixin InitPhysics() ', 'color:#00FF88');
            this._body = Matter.Bodies.rectangle(this.x + (this.width / 2), this.y + (this.height / 2), this.width, this.height, {
                friction: 0,
                frictionAir: 0,
                frictionStatic: 0,
                angularVelocity: 0,
                torque: 0,
                restitution: 1,
                inertia: Infinity,
                label: this.label,
            });
            this._body.plugin = { object: this };
            PhysicsController.get().AddBody(this._body);
            let initialXSpeed = 0;
            let initialYSpeed = 0;
            if (this.defObj.xSpeed || this.defObj.ySpeed) {
                initialXSpeed = (_a = this.defObj.xSpeed) !== null && _a !== void 0 ? _a : 0;
                initialYSpeed = (_b = this.defObj.ySpeed) !== null && _b !== void 0 ? _b : 0;
            }
            else if (this.defObj.randomSpeed) {
                initialXSpeed = (Math.random() > 0.5 ? 1 : -1) * 2;
                initialYSpeed = (Math.random() > 0.5 ? 1 : -1) * 2;
            }
            if (initialXSpeed !== 0 || initialYSpeed !== 0) {
                initialXSpeed = 2;
                initialYSpeed = 2;
                Matter.Body.setVelocity(this._body, { x: initialXSpeed, y: initialYSpeed });
            }
            console.log('%c CanvasPhysicsMixin InitPhysics() END ' + initialXSpeed + '-' + initialYSpeed + ' | ' + super.x + '-' + super.y + ' || ' + ((_c = this._body) === null || _c === void 0 ? void 0 : _c.position.x) + '-' + ((_d = this._body) === null || _d === void 0 ? void 0 : _d.position.y), 'color:#00FF88');
        }
        set x(value) {
            //console.log('%c CanvasPhysicsMixin set x() '+value,'color:#00FF88');
            if (this._resolutionScaleMixLast === -1 && this._body) {
                //this._body.position.x = value + this.width / 2;
                Matter.Body.setPosition(this._body, { x: value + (this.width / 2), y: this._body.position.y });
            }
            super.x = value;
        }
        get x() { return super.x; }
        set y(value) {
            //console.log('%c CanvasPhysicsMixin set y() '+value,'color:#00FF88');
            if (this._resolutionScaleMixLast === -1 && this._body) {
                //this._body.position.y = value + this.height / 2;
                Matter.Body.setPosition(this._body, { x: this._body.position.x, y: value + (this.height / 2) });
            }
            super.y = value;
        }
        get y() { return super.y; }
        checkBody() {
            if (this._body) {
                const w = this._body.bounds.max.x - this._body.bounds.min.x;
                const h = this._body.bounds.max.y - this._body.bounds.min.y;
                //console.log("mixin checkBody     pos> "+this.label+" this="+this.x+"-"+this.y+",  trans="+this.transformedX+"-"+this.transformedY+",  body="+this._body.position.x+"-"+this._body.position.y);
                //console.log("mixin checkBody  bounds> "+this.label+" this="+this.width+"-"+this.height+",  trans="+this.transformedWidth+"-"+this.transformedHeight+",  body="+w+"-"+h);
            }
            else {
                //console.log("mixin checkBody "+this.label+" no body");
            }
        }
        shouldScale(scaleDelta) {
            const shouldScale = Math.abs(1 - scaleDelta) > this._EPSILON;
            //console.log("shouldScale "+this.label+" :"+Math.abs(1 - scaleDelta)+": "+scaleDelta+" "+shouldScale);
            return shouldScale;
        }
        ApplyResolutionScale(scale, property = "") {
            if (!this._body)
                return;
            if (scale !== this._resolutionScaleMixLast) {
                property = "*";
                this._resolutionScaleMixLast = scale;
            }
            if ((property == "*") || (property == "x" && this._transformedMixXlast != this.x)) {
                this._transformedX = this.x * scale;
                this._transformedMixXlast = this.x;
                //Matter.Body.setPosition(this._body, { x: this._transformedX+(this.transformedWidth/2), y: this._body.position.y });
                //console.log("MIX<"+property+">-"+this.label+"APRS  4x("+scale+") x "+this.x+"-trans="+this.transformedX+"-last="+this._transformedMixXlast);
                //this.checkBody();
            }
            if ((property == "*") || (property == "y" && this._transformedMixYlast != this.y)) {
                this._transformedY = this.y * scale;
                this._transformedMixYlast = this.y;
                //Matter.Body.setPosition(this._body, { x: this._body.position.x, y: this.transformedY+(this.transformedHeight/2) });
                //console.log("MIX<"+property+">-"+this.label+"APRS  5("+scale+") y "+this.y+"-trans="+this.transformedY+"-last="+this._transformedMixYlast);
                //this.checkBody();
                //this._transformedYlast = this.y;
            }
            if ((property == "*") || (property == "width" && this._transformedMixWidthlast != this.transformedWidth)) {
                //this._transformedWidth = this.width * scale;
                //console.log("MIX<"+property+">-"+this.label+"APRS  6 width TransW:"+this.transformedWidth+"--"+this._transformedMixWidthlast);
                this._transformedMixWidthlast = this.transformedWidth;
                const bodyWidth = this._body.bounds.max.x - this._body.bounds.min.x;
                if (bodyWidth != this.transformedWidth) {
                    const scaleAmount = this.transformedWidth / bodyWidth;
                    if (this.shouldScale(scaleAmount)) {
                        //console.log("MIX-"+this.label+"APRS  SCALE THAT WIDTH SHIT!!! "+scaleAmount);
                        Matter.Body.scale(this._body, scaleAmount, 1);
                        Matter.Body.setVelocity(this._body, { x: this._body.velocity.x * scaleAmount, y: this._body.velocity.y });
                        Matter.Body.setPosition(this._body, { x: this._transformedX + (this.transformedWidth / 2), y: this._body.position.y });
                        Matter.Body.setInertia(this._body, Infinity);
                        //this.checkBody();
                        //Matter.Body.update(this._body, 0, 1, 1);
                        //Matter.Body.setPosition(this._body, this._body.position);
                        //Matter.Bounds.update(this._body.bounds, this._body.vertices, this._body.velocity);
                    }
                    else {
                        //console.log("EPSILLLLION POWER !!!! Width");
                    }
                }
                else {
                    //console.log("MIX-"+this.label+"APRS w NO SCALE NEEDED");
                }
            }
            if ((property == "*") || (property == "height" && this._transformedMixHeightlast != this.transformedHeight)) {
                //console.log("MIX-"+this.label+"APRS  7 height TransH:"+this.transformedHeight+"--"+this._transformedMixHeightlast);
                this._transformedMixHeightlast = this.transformedHeight;
                const bodyHeight = this._body.bounds.max.y - this._body.bounds.min.y;
                if (bodyHeight != this.transformedHeight) {
                    const scaleAmount = this.transformedHeight / bodyHeight;
                    if (this.shouldScale(scaleAmount)) {
                        //console.log("MIX-"+this.label+"APRS  SCALE THAT HEIGHT SHIT!!! "+scaleAmount);
                        Matter.Body.scale(this._body, 1, scaleAmount);
                        Matter.Body.setVelocity(this._body, { x: this._body.velocity.x, y: this._body.velocity.y * scaleAmount });
                        Matter.Body.setPosition(this._body, { x: this._body.position.x, y: this.transformedY + (this.transformedHeight / 2) });
                        Matter.Body.setInertia(this._body, Infinity);
                        //this.checkBody();
                        //Matter.Body.update(this._body, 0, 1, 1);
                        //Matter.Bounds.update(this._body.bounds, this._body.vertices, this._body.velocity);
                    }
                    else {
                        //console.log("EPSILLLLION POWER !!!! Height");
                    }
                }
                else {
                    //console.log("MIX-"+this.label+"APRS h NO SCALE NEEDED");
                }
            }
        }
        UpdatePhysics(time, frameCount, onceSecond) {
            //console.log("MIXIN UpdatePhysics "+this.label+"<"+frameCount+"> "+time, frameCount, onceSecond);
        }
        Update(time, frameCount, onceSecond) {
            //console.log("MIXIN update "+this.label+"<"+frameCount+"> "+this.x+"/"+this.y+"");
            this.UpdatePhysics(time, frameCount, onceSecond);
            if (this._body) {
                if (this._resolutionScale !== -1) {
                    if (onceSecond) {
                        //console.log('MIXIN.<'+this.x+'/'+this.y+'>........... update update update update update update update update START');
                        //console.log('MIXIN.<'+this.x+'/'+this.y+'>........... update update update update update update update update update START');
                        //console.log('MIXIN.<'+this.x+'/'+this.y+'> this._resolutionScale='+this._resolutionScale+'........... update update update update update update update START');
                        this.checkBody();
                        //console.log(' LOL ok try this1 :: '+(this._body.position.x/this._resolutionScale));
                        //console.log(' LOL ok try this2 :: '+(this.width / 2));
                    }
                    this.x = (this._body.position.x / this._resolutionScale) - (this.width / 2);
                    this.y = (this._body.position.y / this._resolutionScale) - (this.height / 2);
                    //if(onceSecond)
                    //{
                    //	console.log('MIXIN.<'+this.x+'/'+this.y+'>........... update update update update update update update update END');
                    //	console.log('MIXIN.<'+this.x+'/'+this.y+'>........... update update update update update update update update update END');
                    //	console.log('MIXIN.<'+this.x+'/'+this.y+'>........... update update update update update update update END');
                    //}
                }
                else {
                    this.x = this._body.position.x - this.width / 2;
                    this.y = this._body.position.y - this.height / 2;
                }
                //console.log("MIXIN update art "+this.label+" "+this.x+"/"+this.y+"");
                //console.log("MIXIN update art "+this.label+" "+this._body.position.x+"/"+this._body.position.y);
            }
            //super.Update(time, frameCount, onceSecond);
        }
        OnCollision(other, impactForce) {
            //console.log(`💥💥💥💥💥💥 MIXIN Collision! ${this.label} hit ${other.label} with force ${impactForce}`);
            if (impactForce > 1) {
                //console.log("impactForce:"+impactForce);
                //this.artboard.textRun("Run1").text = `Impact: ${impactForce.toFixed(2)}`;
            }
        }
        Dispose() {
            super.Dispose();
            try {
                if (this._body) {
                    if (PhysicsController.get().engine != null && PhysicsController.get().engine.world != null) {
                        Matter.World.remove(PhysicsController.get().engine.world, this._body);
                    }
                    this._body.plugin = { object: null };
                    this._body = null;
                }
            }
            catch (error) {
                console.error("Error physics mixin during dispose:", error);
            }
        }
    };
}
