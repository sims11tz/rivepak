import { LinearAnimationInstance } from "@rive-app/webgl-advanced";

export class RiveTimelineController {
	private _playing = false;
	private _speed = 1;
	private _easeActive = false;
	private _easeElapsed = 0;
	private _easeDuration = 0;
	private _easeStart = 0;
	private _easeEnd = 0;
	private _duration: number;
	private _name: string;
	private _animationMeataDataId:string;
	private _anim:LinearAnimationInstance | null = null;

	constructor(
		animationMeataDataId:string,
		anim:LinearAnimationInstance,
		duration?: number,
		name?: string
	) {
		this._animationMeataDataId = animationMeataDataId;
		this._anim = anim;

		// Debug: Check what duration value we're receiving
		//console.log(`RiveTimelineController constructor called:`);
		//console.log(`  - duration parameter: ${duration}`);
		//console.log(`  - anim.duration: ${this._anim.duration}`);
		//console.log(`  - anim properties:`, Object.keys(this._anim));

		// Store the duration and name passed from AnimationMetadata
		// Check if duration is valid, otherwise use anim.duration
		if (duration !== undefined && duration > 0 && duration < 100000) {
			this._duration = duration;
		} else {
			// Try to get duration from the animation instance
			this._duration = this._anim.duration ?? 10; // Default to 10 seconds if not found
			console.warn(`Duration was invalid (${duration}), using anim.duration: ${this._duration}`);
		}

		this._name = name ?? this._anim.name ?? "";
		this.Pause();

		// Debug log to check values
		//console.log(`RiveTimelineController created: name=${this._name}, duration=${this._duration}s, fps=${this._fps}, frameCount=${this.FrameCount}`);
	}

	private get _fps():number
	{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this._anim as any).Fps ?? 60;
	}

	get AnimationMetaDataId():string { return this._animationMeataDataId; }
	get Animation():LinearAnimationInstance | null { return this._anim; }
	get TimeSeconds():number { return this._anim?.time ?? 0; }
	get DurationSeconds():number { return this._duration; }
	get Percent():number
	{
		const d = this._duration || 1;
		const time = this._anim?.time ?? 0;
		// Handle looping animations - use modulo to wrap the percentage between 0-1
		const normalizedTime = time % d;
		return normalizedTime / d;  // Returns 0-1
	}
	get Percent100():number { return this.Percent * 100; }  // Returns 0-100
	get Fps():number { return this._fps; }
	get Frame(): number {
		const time = this._anim?.time ?? 0;
		return Math.min(Math.round(time * this._fps), 999999);
	}
	get FrameCount():number {
		// Ensure we don't return an invalid frame count
		const count = Math.round(this._duration * this._fps);
		if (count < 0 || count > 999999 || !isFinite(count)) {
			console.warn(`Invalid frame count calculated: ${count}, duration: ${this._duration}, fps: ${this._fps}`);
			return 600; // Default to 600 frames (10 seconds at 60fps)
		}
		return count;
	}

	get RemainingSeconds():number
	{
		return Math.max(0, this._duration - (this._anim?.time ?? 0));
	}

	get RemainingFrames():number
	{
		return Math.max(0, this.FrameCount - this.Frame);
	}
	get IsPlaying():boolean { return this._playing; }
	get IsEasing():boolean { return this._easeActive; }

	Play(speed = 1) { this._playing = true; this._speed = speed; }
	Pause() { this._playing = false; }

	SeekSeconds(t: number)
	{
		if(this._anim == null) return;
		const clamped = Math.max(0, Math.min(this._duration, t));
		this._anim.time = clamped;
		this._anim.apply(1);
	}

	SeekPercent(p:number) { this.SeekSeconds(p * this._duration); }
	SeekFrame(f:number) { this.SeekSeconds(f / this._fps); }
	AdvanceFrame(n=1) { this.SeekSeconds((this._anim?.time ?? 0) + n / this._fps); }

	EaseToPercent(p: number, duration = 0.5) {
		if(this._anim == null) return;

		this._easeStart = this._anim.time;
		this._easeEnd = Math.max(0, Math.min(1, p)) * this._duration;
		this._easeDuration = Math.max(0.001, duration);
		this._easeElapsed = 0;
		this._easeActive = true;
		this._playing = false;
	}

	Update(time:number,_frameCount:number,_onceSecond:boolean)
	{
		if(this._anim == null) return;

		//if(onceSecond) console.log('<'+frameCount+'>RiveTimelineController - ' + this._name);
		if(this._playing)
		{
			//if(onceSecond) console.log('<'+frameCount+'>RiveTimelineController.playing --- '+(time * this._speed));
			this._anim.advance(time * this._speed);
		}
		else
		{
			//if(onceSecond) console.log('<'+frameCount+'>RiveTimelineController NOT PLAYING');
		}

		if(this._easeActive)
		{
			this._easeElapsed += time;
			const a = Math.min(this._easeElapsed / this._easeDuration, 1);
			// easeInOutQuad
			const e = a < 0.5 ? 2 * a * a : 1 - Math.pow(-2 * a + 2, 2) / 2;
			this._anim.time = this._easeStart + (this._easeEnd - this._easeStart) * e;
			if (a >= 1) this._easeActive = false;
		}

		this._anim.apply(1);
	}

	Dispose()
	{
		this._anim = null;
	}
}
