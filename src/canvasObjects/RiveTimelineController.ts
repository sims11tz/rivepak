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
		// Store the duration and name passed from AnimationMetadata
		this._duration = duration ?? this._anim.duration ?? 0;
		this._name = name ?? this._anim.name ?? "";
		this.Pause();
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
		return this._anim?.time ?? 0 / d;
	}
	get Percent100():number { return this.Percent * 100; }
	get Fps():number { return this._fps; }
	get Frame(): number { return Math.round((this._anim?.time ?? 0) * this._fps); }
	get FrameCount():number { return Math.round(this._duration * this._fps); }

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

	Update(time:number,frameCount:number,onceSecond:boolean)
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
