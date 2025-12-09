import Matter from "matter-js";
import { BaseCanvasObj } from "./_baseCanvasObj";
import { PhysicsController } from "../controllers/PhysicsController";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = {}> = new (...args: any[]) => T;

interface iCollisionMixin
{
	InitPhysics(): void;
	OnCollision(other: BaseCanvasObj, impactForce: number): void;
	UpdatePhysics(time: number, frameCount: number, onceSecond: boolean, onceMinute: boolean): void;
	Dispose(): void;
}

interface PhysicsPluginData { object: BaseCanvasObj; }

export function CanvasPhysicsMixin<T extends Constructor<BaseCanvasObj>>(Base:T)
{
	return class extends Base implements iCollisionMixin
	{
		public _body: Matter.Body | null = null;

		public _resolutionScaleMixLast: number = -1;
		public _transformedMixWidthlast: number = -1;
		public _transformedMixHeightlast: number = -1;
		public _transformedMixXlast: number = -1;
		public _transformedMixYlast: number = -1;

		public InitPhysics(): void
		{
			//console.log('%c CanvasPhysicsMixin InitPhysics() ','color:#d2bc1c8');
			//console.log('%c CanvasPhysicsMixin InitPhysics() width:'+this.width+',height:'+this.height,'color:#d2bc1c8');

			// Apply collision adjustments from defObj (default to 1.0 ratio and 0 offset)
			const widthRatio = this.defObj.collisionWidthRatio ?? 1.0;
			const heightRatio = this.defObj.collisionHeightRatio ?? 1.0;
			const xOffset = this.defObj.collisionXOffset ?? 0;
			const yOffset = this.defObj.collisionYOffset ?? 0;

			console.log(`%c [PhysicsMixin] InitPhysics for ${this.label}: widthRatio=${widthRatio}, heightRatio=${heightRatio}, xOffset=${xOffset}, yOffset=${yOffset}`, 'color:#FF00FF;');
			console.log(`%c [PhysicsMixin] defObj collision values: wR=${this.defObj.collisionWidthRatio}, hR=${this.defObj.collisionHeightRatio}, xO=${this.defObj.collisionXOffset}, yO=${this.defObj.collisionYOffset}`, 'color:#FF00FF;');

			const collisionWidth = this.width * widthRatio;
			const collisionHeight = this.height * heightRatio;
			const collisionCenterX = this.x + (this.width / 2) + xOffset;
			const collisionCenterY = this.y + (this.height / 2) + yOffset;

			this._body = Matter.Bodies.rectangle(collisionCenterX, collisionCenterY, collisionWidth, collisionHeight, {
				friction: 0,
				frictionAir: 0,
				frictionStatic: 0,
				angularVelocity: 0,
				torque: 0,
				restitution: 1,
				inertia: Infinity,
				label: this.label,
			});
			//console.log('%c CanvasPhysicsMixin InitPhysics() check body','color:#d2bc1c8');
			//this.checkBody();

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
				initialXSpeed = 2;
				initialYSpeed = 2;
				Matter.Body.setVelocity(this._body, { x: initialXSpeed, y: initialYSpeed });
			}

			//console.log('%c CanvasPhysicsMixin InitPhysics() END '+initialXSpeed+'-'+initialYSpeed+' | '+super.x+'-'+super.y+' || '+this._body?.position.x+'-'+this._body?.position.y,'color:#00FF88');
		}

		public set x(value:number)
		{
			//console.log('%c CanvasPhysicsMixin set x() '+value,'color:#00FF88');
			if (this._resolutionScaleMixLast === -1 && this._body)
			{
				//this._body.position.x = value + this.width / 2;
				Matter.Body.setPosition(this._body, { x: value+(this.width/2), y: this._body.position.y });
			}
			super.x = value;
		}

		public get x(): number { return super.x; }

		public set y(value:number)
		{
			//console.log('%c CanvasPhysicsMixin set y() '+value,'color:#00FF88');
			if (this._resolutionScaleMixLast === -1 && this._body)
			{
				//this._body.position.y = value + this.height / 2;
				Matter.Body.setPosition(this._body, { x: this._body.position.x, y: value+(this.height/2) });

			}
			super.y = value;
		}

		public get y(): number { return super.y; }

		public checkBody()
		{
			if(this._body)
			{
				const w = this._body.bounds.max.x - this._body.bounds.min.x;
				const h = this._body.bounds.max.y - this._body.bounds.min.y;
				console.log("mixin checkBody     pos> "+this.label+" this="+this.x+"-"+this.y+",  trans="+this.transformedX+"-"+this.transformedY+",  body="+this._body.position.x+"-"+this._body.position.y);
				console.log("mixin checkBody  bounds> "+this.label+" this="+this.width+"-"+this.height+",  trans="+this.transformedWidth+"-"+this.transformedHeight+",  body="+w+"-"+h);
			}
			else
			{
				console.log("mixin checkBody "+this.label+" no body");
			}
		}

		public readonly _EPSILON = 0.0001;
		public shouldScale(scaleDelta:number): boolean
		{
			const shouldScale = Math.abs(1 - scaleDelta) > this._EPSILON;
			//console.log("shouldScale "+this.label+" :"+Math.abs(1 - scaleDelta)+": "+scaleDelta+" "+shouldScale);
			return shouldScale;
		}

		public ApplyResolutionScale(scale:number, property:string="")
		{
			//console.log('%c CanvasPhysicsMixin ApplyResolutionScale','color:#d2bc1c8');

			if(!this._body) return;
			//console.log('%c CanvasPhysicsMixin ApplyResolutionScale(*) ','color:#d2bc1c8');

			if(scale !== this._resolutionScaleMixLast)
			{
				property = "*";
				this._resolutionScaleMixLast = scale;
			}

			if((property == "*") || (property == "x" && this._transformedMixXlast != this.x))
			{
				this._transformedX = this.x * scale;
				this._transformedMixXlast = this.x
				//Matter.Body.setPosition(this._body, { x: this._transformedX+(this.transformedWidth/2), y: this._body.position.y });
				//console.log("MIX<"+property+">-"+this.label+"APRS  4x("+scale+") x "+this.x+"-trans="+this.transformedX+"-last="+this._transformedMixXlast);
				//this.checkBody();
			}

			if((property == "*") || (property == "y" && this._transformedMixYlast != this.y))
			{
				this._transformedY = this.y * scale;
				this._transformedMixYlast = this.y;
				//Matter.Body.setPosition(this._body, { x: this._body.position.x, y: this.transformedY+(this.transformedHeight/2) });
				//console.log("MIX<"+property+">-"+this.label+"APRS  5("+scale+") y "+this.y+"-trans="+this.transformedY+"-last="+this._transformedMixYlast);
				//this.checkBody();
				//this._transformedYlast = this.y;
			}

			if((property == "*") || (property == "width" && this._transformedMixWidthlast != this.transformedWidth))
			{
				//this._transformedWidth = this.width * scale;
				//console.log("MIX<"+property+">-"+this.label+"APRS  6 width TransW:"+this.transformedWidth+"--"+this._transformedMixWidthlast);
				this._transformedMixWidthlast = this.transformedWidth;

				const bodyWidth = this._body.bounds.max.x-this._body.bounds.min.x;
				if(bodyWidth != this.transformedWidth)
				{
					const scaleAmount = this.transformedWidth / bodyWidth;
					if(this.shouldScale(scaleAmount))
					{
						//console.log('%c MIX-'+this.label+'APRS  SCALE THAT WIDTH SHIT!!! bodyWidth='+bodyWidth+', this.transformedWidth='+this.transformedWidth+' scaleAmount='+scaleAmount,'color:#4783ff');
						Matter.Body.scale(this._body, scaleAmount, 1);
						Matter.Body.setVelocity(this._body, { x: this._body.velocity.x * scaleAmount, y: this._body.velocity.y });
						Matter.Body.setPosition(this._body, { x: this._transformedX+(this.transformedWidth/2), y: this._body.position.y });
						Matter.Body.setInertia(this._body, Infinity);
						//this.checkBody();
						//Matter.Body.update(this._body, 0, 1, 1);
						//Matter.Body.setPosition(this._body, this._body.position);
						//Matter.Bounds.update(this._body.bounds, this._body.vertices, this._body.velocity);
					}
					else
					{
						//console.log("EPSILLLLION POWER !!!! Width");
					}
				}
				else
				{
					//console.log("MIX-"+this.label+"APRS w NO SCALE NEEDED");
				}
			}

			if((property == "*") || (property == "height" && this._transformedMixHeightlast != this.transformedHeight))
			{
				//console.log("MIX-"+this.label+"APRS  7 height TransH:"+this.transformedHeight+"--"+this._transformedMixHeightlast);
				this._transformedMixHeightlast = this.transformedHeight;

				const bodyHeight = this._body.bounds.max.y-this._body.bounds.min.y;
				if(bodyHeight != this.transformedHeight)
				{
					const scaleAmount = this.transformedHeight / bodyHeight;
					if(this.shouldScale(scaleAmount))
					{
						//console.log("MIX-"+this.label+"APRS  SCALE THAT HEIGHT SHIT!!! "+scaleAmount);
						//console.log('%c MIX-'+this.label+'APRS  SCALE THAT HEIGHT SHIT!!! bodyHeight='+bodyHeight+', this.transformedHeight='+this.transformedHeight+' scaleAmount='+scaleAmount,'color:#4783ff');
						Matter.Body.scale(this._body, 1, scaleAmount);
						Matter.Body.setVelocity(this._body, { x: this._body.velocity.x, y: this._body.velocity.y * scaleAmount });
						Matter.Body.setPosition(this._body, { x: this._body.position.x, y: this.transformedY+(this.transformedHeight/2) });
						Matter.Body.setInertia(this._body, Infinity);
						//this.checkBody();
						//Matter.Body.update(this._body, 0, 1, 1);
						//Matter.Bounds.update(this._body.bounds, this._body.vertices, this._body.velocity);
					}
					else
					{
						//console.log("EPSILLLLION POWER !!!! Height");
					}
				}
				else
				{
					//console.log("MIX-"+this.label+"APRS h NO SCALE NEEDED");
				}
			}
		}

		public UpdatePhysics(time: number, frameCount: number, onceSecond: boolean, onceMinute: boolean): void
		{
			//console.log("MIXIN UpdatePhysics "+this.label+"<"+frameCount+"> "+time, frameCount, onceSecond);
		}

		public Update(time: number, frameCount: number, onceSecond: boolean, onceMinute: boolean): void
		{
			//if(onceSecond) console.log("MIXIN update "+this.label+"<"+frameCount+"> "+this.x+"/"+this.y+"");
			this.UpdatePhysics(time, frameCount, onceSecond, onceMinute);

			if (this._body)
			{
				if(this._resolutionScale !== -1)
				{
					if(onceSecond)
					{
						//console.log('MIXIN.<'+this.x+'/'+this.y+'>........... update update update update update update update update START');
						//console.log('MIXIN.<'+this.x+'/'+this.y+'>........... update update update update update update update update update START');
						//console.log('MIXIN.<'+this.x+'/'+this.y+'> this._resolutionScale='+this._resolutionScale+'........... update update update update update update update START');
						//this.checkBody();
						//console.log(' LOL ok try this1 :: '+(this._body.position.x/this._resolutionScale));
						//console.log(' LOL ok try this2 :: '+(this.width / 2));
					}
					this.x = (this._body.position.x/this._resolutionScale) - (this.width / 2);
					this.y = (this._body.position.y/this._resolutionScale) - (this.height / 2);
					//if(onceSecond)
					//{
					//	console.log('MIXIN.<'+this.x+'/'+this.y+'>........... update update update update update update update update END');
					//	console.log('MIXIN.<'+this.x+'/'+this.y+'>........... update update update update update update update update update END');
					//	console.log('MIXIN.<'+this.x+'/'+this.y+'>........... update update update update update update update END');
					//}
				}
				else
				{
					this.x = this._body.position.x - this.width / 2;
					this.y = this._body.position.y - this.height / 2;
				}

				//if(onceSecond)
				//{
				//	console.log("MIXIN update art "+this.label+" "+this.x+"/"+this.y+"");
				//	console.log("MIXIN update art "+this.label+" "+this._body.position.x+"/"+this._body.position.y);
				//}
			}
			else
			{
				if(onceSecond)
				{
					//console.log("MIXIN update NO BODY "+this.label+" "+this.x+"/"+this.y+"");
				}
			}

			//super.Update(time, frameCount, onceSecond);
		}

		public OnCollision(other: BaseCanvasObj, impactForce: number): void
		{
			//console.log(`💥💥💥💥💥💥 MIXIN Collision! ${this.label} hit ${other.label} with force ${impactForce}`);

			if (impactForce > 1)
			{
				//console.log("impactForce:"+impactForce);
				//this.artboard.textRun("Run1").text = `Impact: ${impactForce.toFixed(2)}`;

			}
		}

		public Dispose():void
		{
			try
			{
				if(this._body)
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

			super.Dispose();
		}
	};
}
