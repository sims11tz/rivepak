// keep your imports as-is if they work in your setup
import { Artboard, LinearAnimationInstance } from "@rive-app/webgl-advanced";

export class RiveTimelineController {
	private playing = false;
	private speed = 1;
	private easeActive = false;
	private easeElapsed = 0;
	private easeDuration = 0;
	private easeStart = 0;
	private easeEnd = 0;
	private _duration: number;
	private _name: string;

	constructor(
		private anim:LinearAnimationInstance,
		private artboard:Artboard,
		duration?: number,
		name?: string
	) {
		// Store the duration and name passed from AnimationMetadata
		this._duration = duration ?? (anim as any).duration ?? 0;
		this._name = name ?? (anim as any).name ?? "";
	}

	private get _fps(): number
	{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.anim as any).Fps ?? 60;
	}

	get Animation(): LinearAnimationInstance { return this.anim; }
	get TimeSeconds(): number { return this.anim.time; }
	get DurationSeconds(): number { return this._duration; }
	get Percent(): number
	{
		const d = this._duration || 1;
		return this.anim.time / d;
	}
	get Percent100(): number { return this.Percent * 100; }
	get Fps(): number { return this._fps; }
	get Frame(): number { return Math.round(this.anim.time * this._fps); }
	get FrameCount(): number { return Math.round(this._duration * this._fps); }

	get RemainingSeconds(): number
	{
		return Math.max(0, this._duration - this.anim.time);
	}

	get RemainingFrames(): number
	{
		return Math.max(0, this.FrameCount - this.Frame);
	}
	get IsPlaying(): boolean { return this.playing; }
	get IsEasing(): boolean { return this.easeActive; }

	/* --------------- controls you already had --------------- */

	Play(speed = 1) { this.playing = true; this.speed = speed; }
	Pause() { this.playing = false; }

	SeekSeconds(t: number)
	{
		const clamped = Math.max(0, Math.min(this._duration, t));
		this.anim.time = clamped;
		this.anim.apply(1);
		//this.artboard.advance(0);
	}

	SeekPercent(p: number) { this.SeekSeconds(p * this._duration); }
	SeekFrame(f: number)   { this.SeekSeconds(f / this._fps); }
	AdvanceFrame(n = 1)    { this.SeekSeconds(this.anim.time + n / this._fps); }

	EaseToPercent(p: number, duration = 0.5) {
		this.easeStart = this.anim.time;
		this.easeEnd = Math.max(0, Math.min(1, p)) * this._duration;
		this.easeDuration = Math.max(0.001, duration);
		this.easeElapsed = 0;
		this.easeActive = true;
		this.playing = false; // pause while easing
	}

	//this._animations.forEach((animationMeta) =>
	//		{
	//			if (animationMeta.autoPlay)
	//			{
	//				animationMeta.animation.advance(time);
	//				animationMeta.animation.apply(1);
	//			}
	//		});

	Update(time:number,frameCount:number,onceSecond:boolean)
	{
		if(this.playing)
		{
			this.anim.advance(time * this.speed);
		}

		if(this.easeActive)
		{
			this.easeElapsed += time;
			const a = Math.min(this.easeElapsed / this.easeDuration, 1);
			// easeInOutQuad
			const e = a < 0.5 ? 2 * a * a : 1 - Math.pow(-2 * a + 2, 2) / 2;
			this.anim.time = this.easeStart + (this.easeEnd - this.easeStart) * e;
			if (a >= 1) this.easeActive = false;
		}

		this.anim.apply(1);
	}

	Dispose()
	{
		this.anim = null!;
		this.artboard = null!;
	}
}
