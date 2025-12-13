import Matter from "matter-js";
import { RivePhysicsObject } from "../canvasObjects/RivePhysicsObj";

export class PhysicsController
{
	static myInstance: PhysicsController;
	static get() { if (PhysicsController.myInstance == null) { PhysicsController.myInstance = new PhysicsController(); } return this.myInstance; }

	public get engine() { return this._engine!; }
	private _engine: Matter.Engine | null = null;
	private _debugRender: Matter.Render | null = null;
	private _debugRenderDiv: HTMLDivElement | null = null;

	private _physicswalls:boolean = false;
	private _wallOptions = { isStatic: true, restitution: 1, friction: 0, frictionStatic: 0, frictionAir: 0, wallThickness: 0.035 };
	private _logicalWidth:number = 0;
	private _logicalHeight:number = 0;

	// Wall offsets (positive = inward from edge)
	private _wallOffsets = { top: 0, bottom: 0, left: 0, right: 0 };

	private wallThickness(delta:number) { return delta*this._wallOptions.wallThickness; }

	public Init(canvas:HTMLCanvasElement, physicsWalls:boolean=false, debugRenderDiv:HTMLDivElement, debug:boolean = false)
	{
		this._physicswalls = physicsWalls;
		this._debugRenderDiv = debugRenderDiv;

		if (this._debugRender)
		{
			Matter.Render.stop(this._debugRender);
			this._debugRender.canvas.remove();
			this._debugRender = null;
		}

		this._engine = Matter.Engine.create();
		this._engine.gravity.y = 0;
		this._engine.gravity.x = 0;

		// Use clientWidth/clientHeight for logical (CSS) dimensions
		// These are the actual rendered size, not the internal buffer size
		this._logicalWidth = canvas.clientWidth || canvas.width;
		this._logicalHeight = canvas.clientHeight || canvas.height;

		if (debug && debugRenderDiv)
		{
			// Create debug render at LOGICAL dimensions (not physical pixels)
			this._debugRender = Matter.Render.create({
				element: debugRenderDiv,
				engine: this._engine,
				options: {
					width: this._logicalWidth,
					height: this._logicalHeight,
					wireframes: false,
					background: "transparent",
				},
			});
			Matter.Render.run(this._debugRender);
		}
		else if (debugRenderDiv)
		{
			debugRenderDiv.style.display = "none";
		}

		Matter.Events.on(this._engine, "collisionStart", this.handleCollision);
		if(physicsWalls)
		{
			this.createWalls();
		}
	}

	public SetSize(width:number, height:number, dprIn:number=-1)
	{
		// Width/height are logical dimensions, store them
		this._logicalWidth = width;
		this._logicalHeight = height;

		if (this._debugRender)
		{
			// Use logical dimensions for the debug render canvas
			this._debugRender.canvas.width = width;
			this._debugRender.canvas.height = height;
			this._debugRender.options.width = width;
			this._debugRender.options.height = height;
		}

		// Rebuild walls if they exist (using new logical dimensions)
		if (this._engine && this._physicswalls)
		{
			this.removeWalls();
			this.createWalls();
		}
	}

	/**
	 * Enable physics walls at canvas boundaries
	 * Can be called at runtime to add walls dynamically
	 * @param offsets - Optional offsets to move walls inward (positive = inward from edge)
	 */
	public EnableWalls(offsets?:{top?:number, bottom?:number, left?:number, right?:number}):void
	{
		if(!this._engine) return;
		if(this._physicswalls) return; // Already enabled

		// Store offsets
		if(offsets)
		{
			this._wallOffsets.top = offsets.top ?? 0;
			this._wallOffsets.bottom = offsets.bottom ?? 0;
			this._wallOffsets.left = offsets.left ?? 0;
			this._wallOffsets.right = offsets.right ?? 0;
		}

		this._physicswalls = true;
		this.createWalls();
	}

	/**
	 * Disable physics walls
	 * Can be called at runtime to remove walls dynamically
	 */
	public DisableWalls():void
	{
		if(!this._engine) return;
		if(!this._physicswalls) return; // Already disabled

		this._physicswalls = false;
		this.removeWalls();
	}

	/**
	 * Check if physics walls are currently enabled
	 */
	public get wallsEnabled():boolean
	{
		return this._physicswalls;
	}

	/**
	 * Create boundary walls using current logical dimensions and offsets
	 */
	private createWalls():void
	{
		if(!this._engine) return;

		const width = this._logicalWidth;
		const height = this._logicalHeight;
		const thickness = this.wallThickness(width);

		// Apply offsets (positive = inward from edge)
		const topY = this._wallOffsets.top;
		const bottomY = height - this._wallOffsets.bottom;
		const leftX = this._wallOffsets.left;
		const rightX = width - this._wallOffsets.right;

		// Calculate effective width/height for horizontal/vertical walls
		const effectiveWidth = rightX - leftX;
		const effectiveHeight = bottomY - topY;
		const centerX = leftX + effectiveWidth / 2;
		const centerY = topY + effectiveHeight / 2;

		const walls = [
			// Top wall
			Matter.Bodies.rectangle(centerX, topY, effectiveWidth, thickness, this._wallOptions),
			// Bottom wall
			Matter.Bodies.rectangle(centerX, bottomY, effectiveWidth, thickness, this._wallOptions),
			// Left wall
			Matter.Bodies.rectangle(leftX, centerY, thickness, effectiveHeight, this._wallOptions),
			// Right wall
			Matter.Bodies.rectangle(rightX, centerY, thickness, effectiveHeight, this._wallOptions),
		];
		walls.forEach(w => (w as any).isWall = true);
		Matter.World.add(this._engine.world, walls);
	}

	/**
	 * Remove all boundary walls from the physics world
	 */
	private removeWalls():void
	{
		if(!this._engine) return;

		const world = this._engine.world;
		const wallsToRemove = world.bodies.filter(b => (b as any).isWall);
		wallsToRemove.forEach(w => Matter.World.remove(world, w));
	}

	public AddBody(body: Matter.Body)
	{
		if (this._engine)
		{
			Matter.World.add(this._engine.world, body);
		}
	}

	public Update(time:number, frameCount:number, onceSecond:boolean, onceMinute:boolean): void
	{
		if (this._engine)
		{
			const fixedTimeStep = Math.min(time * 1000, 16.667);
			Matter.Engine.update(this._engine, fixedTimeStep);
		}
	}

	private handleCollision = (event: Matter.IEventCollision<Matter.Engine>) =>
	{
		event.pairs.forEach((pair) =>
		{
			const bodyA = pair.bodyA;
			const bodyB = pair.bodyB;

			const objA = bodyA.parent?.plugin?.object as RivePhysicsObject;
			const objB = bodyB.parent?.plugin?.object as RivePhysicsObject;

			if (objA && objB)
			{
				const impactForce = Matter.Vector.magnitude(pair.collision.penetration);
				objA.OnCollision(objB, impactForce);
				objB.OnCollision(objA, impactForce);
			}
		});
	};

	public Dispose()
	{
		if (this._engine)
		{
			Matter.Events.off(this._engine, "collisionStart", this.handleCollision);
			Matter.World.clear(this._engine.world, false);
			this._engine = null;
		}

		if (this._debugRender)
		{
			Matter.Render.stop(this._debugRender);
			this._debugRender.canvas.remove();
			this._debugRender = null;
		}

		this._debugRenderDiv = null;
		this._logicalWidth = 0;
		this._logicalHeight = 0;
	}
}
