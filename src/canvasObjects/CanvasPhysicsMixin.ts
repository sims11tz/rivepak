import Matter from "matter-js";
import { CanvasObj } from "./CanvasObj";
import { PhysicsController } from "../controllers/PhysicsController";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = {}> = new (...args: any[]) => T;

interface iCollisionMixin
{
	InitPhysics(): void;
	OnCollision(other: CanvasObj, impactForce: number): void;
	UpdatePhysics(time: number, frameCount: number, onceSecond: boolean): void;
	Dispose(): void;
}

interface PhysicsPluginData { object: CanvasObj; }

export function CanvasPhysicsMixin<T extends Constructor<CanvasObj>>(Base: T)
{
	return class extends Base implements iCollisionMixin
	{
		public _body: Matter.Body | null = null;

		public InitPhysics(): void
		{
			this._body = Matter.Bodies.rectangle(this.x, this.y, this.width, this.height, {
				friction: 0,
				frictionAir: 0,
				restitution: 1, // Bounciness
				inertia: Infinity, // Prevents rotation
				label: this.label,
			});

			//(this._body as any).plugin = { object: this };
			(this._body as Matter.Body & { plugin: PhysicsPluginData }).plugin = { object: this };

			PhysicsController.get().AddBody(this._body);

			let initialXSpeed = 0;
			let initialYSpeed = 0;

			if(this.defObj.xSpeed || this.defObj.ySpeed)
			{
				initialXSpeed = this.defObj.xSpeed ?? 0;
				initialYSpeed = this.defObj.ySpeed ?? 0;
			}
			else if(this.defObj.randomSpeed)
			{
				initialXSpeed = (Math.random() > 0.5 ? 1 : -1) * 2;
				initialYSpeed = (Math.random() > 0.5 ? 1 : -1) * 2;
			}

			if(initialXSpeed !== 0 || initialYSpeed !== 0)
			{
				Matter.Body.setVelocity(this._body, { x: initialXSpeed, y: initialYSpeed });
			}
		}

		public UpdatePhysics(time: number, frameCount: number, onceSecond: boolean): void
		{

		}

		public Update(time: number, frameCount: number, onceSecond: boolean): void
		{
			this.UpdatePhysics(time, frameCount, onceSecond);
		}

		public OnCollision(other: CanvasObj, impactForce: number): void
		{
			//console.log(`💥💥💥💥💥💥 MIXIN Collision! ${this.label} hit ${other.label} with force ${impactForce}`);

			if (impactForce > 1)
			{
				//console.log("impactForce:"+impactForce);
				//this.artboard.textRun("Run1").text = `Impact: ${impactForce.toFixed(2)}`;

			}
		}

		public Dispose(): void
		{
			super.Dispose();

			try
			{
				if (this._body)
				{
					if(PhysicsController.get().engine != null && PhysicsController.get().engine.world != null)
					{
						Matter.World.remove(PhysicsController.get().engine.world, this._body);
					}

					(this._body as Matter.Body & { plugin: PhysicsPluginData }).plugin = { object: null };
					this._body = null;
				}
			}
			catch (error)
			{
				console.error("Error physics mixin during dispose:", error);
			}
		}
	};
}
