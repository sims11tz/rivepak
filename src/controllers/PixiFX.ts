import * as PIXI from 'pixi.js';
import { CanvasRiveObj } from '../canvasObjects/CanvasRiveObj';
import { PixiController } from './PixiController';

export enum FXType
{
	DAMAGE = 'damage',
	HEAL = 'heal',
	BUFF = 'buff',
}

export class PixiFX
{
	private static _flashColorMap: Record<FXType, number> = {
		[FXType.DAMAGE]: 0xff0000,
		[FXType.HEAL]: 0x00ff00,
		[FXType.BUFF]: 0x00ccff,
	};

	public static Flash(target: CanvasRiveObj, color: number = 0xff0000, duration: number = 300, alpha: number = 0.6): void
	{
		const app = PixiController.get().Pixi;
		const bounds = new PIXI.Rectangle(
			target.transformedX,
			target.transformedY,
			target.transformedWidth,
			target.transformedHeight
		);
		const rt = PIXI.RenderTexture.create({
			width: bounds.width,
			height: bounds.height,
		});
		// NOTE: Typescript doesn't recognize the full signature, so cast as any
		(app.renderer.render as any)(app.stage, { renderTexture: rt, clear: false, sourceFrame: bounds });
		const sprite = new PIXI.Sprite(rt);
		sprite.tint = color;
		sprite.alpha = alpha;
		sprite.x = bounds.x;
		sprite.y = bounds.y;
		sprite.zIndex = target.z + 1;
		app.stage.addChild(sprite);
		PIXI.Ticker.shared.add(function fade()
		{
			sprite.alpha -= 0.05;
			if (sprite.alpha <= 0) {
				sprite.destroy();
				PIXI.Ticker.shared.remove(fade);
			}
		});
	}

	public static Shake(target: CanvasRiveObj, duration: number = 300, strength: number = 5): void {
		const ox = target.x;
		const oy = target.y;
		let time = 0;
		const shake = () => {
			time += 16;
			if (time >= duration) {
				target.x = ox;
				target.y = oy;
				PIXI.Ticker.shared.remove(shake);
				return;
			}
			target.x = ox + (Math.random() - 0.5) * strength * 2;
			target.y = oy + (Math.random() - 0.5) * strength * 2;
		};
		PIXI.Ticker.shared.add(shake);
	}

	public static Pulse(target: CanvasRiveObj, duration: number = 500, scaleFactor: number = 0.2): void {
		let up = true, time = 0;
		const half = duration / 2;
		const sx = target.xScale, sy = target.yScale;
		const pulse = () => {
			time += 16;
			const f = up ? 1 + scaleFactor * (time / half) : 1 + scaleFactor - scaleFactor * (time / half);
			target.xScale = sx * f;
			target.yScale = sy * f;
			if (time >= half) {
				if (up) { up = false; time = 0; } else {
					target.xScale = sx;
					target.yScale = sy;
					PIXI.Ticker.shared.remove(pulse);
				}
			}
		};
		PIXI.Ticker.shared.add(pulse);
	}

	public static ParticleBurst(target: CanvasRiveObj, color: number = 0xff0000, count: number = 8): void {
		const cx = target.transformedX + target.transformedWidth / 2;
		const cy = target.transformedY + target.transformedHeight / 2;
		const stage = PixiController.get().Pixi.stage;
		for (let i = 0; i < count; i++) {
			const a = (Math.PI * 2 * i) / count;
			const s = 3 + Math.random() * 3;
			const vx = Math.cos(a) * s;
			const vy = Math.sin(a) * s;
			const p = new PIXI.Graphics();
			p.beginFill(color);
			p.drawCircle(0, 0, 3);
			p.endFill();
			p.x = cx;
			p.y = cy;
			p.alpha = 1;
			p.zIndex = target.z + 2;
			stage.addChild(p);
			let life = 0;
			const move = () => {
				p.x += vx;
				p.y += vy;
				p.alpha -= 0.05;
				life += 16;
				if (life > 500 || p.alpha <= 0) {
					p.destroy();
					PIXI.Ticker.shared.remove(move);
				}
			};
			PIXI.Ticker.shared.add(move);
		}
	}

	public static HitFeedback(target: CanvasRiveObj, type: FXType = FXType.DAMAGE): void {
		const color = this._flashColorMap[type];
		this.Flash(target, color);
		if (type === FXType.DAMAGE) this.Shake(target);
		this.Pulse(target);
		this.ParticleBurst(target, color);
	}

	public static DamageFlash(target: CanvasRiveObj): void {
		this.Flash(target, 0xff0000, 20000, 0.4);
	}
}
