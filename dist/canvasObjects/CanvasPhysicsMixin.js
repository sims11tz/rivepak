import Matter from "matter-js";
import { PhysicsController } from "../controllers/PhysicsController";
export function CanvasPhysicsMixin(Base) {
    return class extends Base {
        constructor() {
            super(...arguments);
            this._body = null;
        }
        initPhysics() {
            var _a, _b;
            this._body = Matter.Bodies.rectangle(this.x, this.y, this.width, this.height, {
                friction: 0,
                frictionAir: 0,
                restitution: 1,
                inertia: Infinity,
                label: this.label,
            });
            //(this._body as any).plugin = { object: this };
            this._body.plugin = { object: this };
            PhysicsController.get().addBody(this._body);
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
                Matter.Body.setVelocity(this._body, { x: initialXSpeed, y: initialYSpeed });
            }
        }
        updatePhysics(time, frameCount, onceSecond) {
        }
        update(time, frameCount, onceSecond) {
            this.updatePhysics(time, frameCount, onceSecond);
        }
        onCollision(other, impactForce) {
            //console.log(`💥💥💥💥💥💥 MIXIN Collision! ${this.label} hit ${other.label} with force ${impactForce}`);
            if (impactForce > 1) {
                //console.log("impactForce:"+impactForce);
                //this.artboard.textRun("Run1").text = `Impact: ${impactForce.toFixed(2)}`;
            }
        }
        dispose() {
            super.dispose();
            try {
                if (this._body) {
                    if (PhysicsController.get().engine != null && PhysicsController.get().engine.world != null) {
                        Matter.World.remove(PhysicsController.get().engine.world, this._body);
                    }
                    //(this._body as any).plugin.object = null;
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
