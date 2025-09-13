import { BaseCanvasObj } from "../canvasObjects/_baseCanvasObj";
import {CanvasSequence, SequenceItem, EASING_TYPE, ANIMATION_TYPE} from "./CanvasSequence";

export class CanvasSequenceController
{
	private static _instance:CanvasSequenceController;
	public static get():CanvasSequenceController { if(!this._instance) this._instance = new CanvasSequenceController(); return this._instance; }

	private _sequencers:Map<string, CanvasSequence> = new Map();
	private _activeSequencers:Set<CanvasSequence> = new Set();

	private constructor() {}

	public CreateSequence(target:BaseCanvasObj, id?:string):CanvasSequence
	{
		const sequenceId = id || target.uuid;

		if(this._sequencers.has(sequenceId))
		{
			this.StopSequence(sequenceId);
		}

		const sequencer = new CanvasSequence(target);
		this._sequencers.set(sequenceId, sequencer);

		// Override the Play method to ensure it's tracked
		const originalPlay = sequencer.Play.bind(sequencer);
		sequencer.Play = (onComplete?:() => void) => {
			this._activeSequencers.add(sequencer);
			originalPlay(() => {
				this._activeSequencers.delete(sequencer);
				onComplete?.();
			});
		};

		return sequencer;
	}

	public GetSequence(id:string):CanvasSequence | undefined
	{
		return this._sequencers.get(id);
	}

	public PlaySequence(id:string, onComplete?:() => void):void
	{
		const sequencer = this._sequencers.get(id);
		if(sequencer)
		{
			this._activeSequencers.add(sequencer);
			sequencer.Play(() =>
			{
				this._activeSequencers.delete(sequencer);
				onComplete?.();
			});
		}
	}

	public StopSequence(id:string):void
	{
		const sequencer = this._sequencers.get(id);
		if(sequencer)
		{
			sequencer.Stop();
			this._activeSequencers.delete(sequencer);
		}
	}

	public PauseSequence(id:string):void
	{
		const sequencer = this._sequencers.get(id);
		if(sequencer)
		{
			sequencer.Pause();
		}
	}

	public ResumeSequence(id:string):void
	{
		const sequencer = this._sequencers.get(id);
		if(sequencer)
		{
			sequencer.Resume();
		}
	}

	public RemoveSequence(id:string):void
	{
		const sequencer = this._sequencers.get(id);
		if(sequencer)
		{
			sequencer.Stop();
			this._activeSequencers.delete(sequencer);
			this._sequencers.delete(id);
		}
	}

	public Update(time:number, deltaTime:number, frameCount:number, oncePerSecond:boolean):void
	{
		for(const sequencer of this._activeSequencers)
		{
			sequencer.Update(time, deltaTime, frameCount, oncePerSecond);
		}
	}

	public StopAll():void
	{
		for(const sequencer of this._sequencers.values())
		{
			sequencer.Stop();
		}
		this._activeSequencers.clear();
	}

	public Clear():void
	{
		this.StopAll();
		this._sequencers.clear();
	}

	public QuickMove(target:BaseCanvasObj, x:number, y:number, duration:number = 1000, easing:EASING_TYPE = EASING_TYPE.EASE_IN_OUT, onComplete?:() => void):void
	{
		const id = `quick_${target.uuid}_${Date.now()}`;
		const seq = this.CreateSequence(target, id);
		seq.AddMove(x, y, duration, easing);
		seq.Play(() =>
		{
			this.RemoveSequence(id);
			onComplete?.();
		});
	}

	public QuickScale(target:BaseCanvasObj, xScale:number, yScale:number, duration:number = 1000, easing:EASING_TYPE = EASING_TYPE.EASE_IN_OUT, onComplete?:() => void):void
	{
		const id = `quick_${target.uuid}_${Date.now()}`;
		const seq = this.CreateSequence(target, id);
		seq.AddScale(xScale, yScale, duration, easing);
		seq.Play(() =>
		{
			this.RemoveSequence(id);
			onComplete?.();
		});
	}

	public QuickSequence(target:BaseCanvasObj, items:SequenceItem[], onComplete?:() => void):void
	{
		const id = `quick_${target.uuid}_${Date.now()}`;
		const seq = this.CreateSequence(target, id);
		for(const item of items)
		{
			seq.Add(item);
		}
		seq.Play(() =>
		{
			this.RemoveSequence(id);
			onComplete?.();
		});
	}

	public QuickSpring(target:BaseCanvasObj, property:"x"|"y"|"xScale"|"yScale", targetValue:number, stiffness:number = 700, damping:number = 50, onComplete?:() => void):void
	{
		const id = `spring_${target.uuid}_${Date.now()}`;
		const seq = this.CreateSequence(target, id);
		seq.AddSpring(property, targetValue, stiffness, damping);
		seq.Play(() =>
		{
			this.RemoveSequence(id);
			onComplete?.();
		});
	}

	public QuickBounce(target:BaseCanvasObj, x:number, y:number, duration:number = 1000, onComplete?:() => void):void
	{
		const id = `bounce_${target.uuid}_${Date.now()}`;
		const seq = this.CreateSequence(target, id);
		seq.AddMove(x, y, duration, EASING_TYPE.BOUNCE_OUT);
		seq.Play(() =>
		{
			this.RemoveSequence(id);
			onComplete?.();
		});
	}

	public QuickElastic(target:BaseCanvasObj, xScale:number, yScale:number, onComplete?:() => void):void
	{
		const id = `elastic_${target.uuid}_${Date.now()}`;
		const seq = this.CreateSequence(target, id);
		seq.AddSpring("xScale", xScale, 300, 10);
		seq.AddSpring("yScale", yScale, 300, 10);
		seq.Play(() =>
		{
			this.RemoveSequence(id);
			onComplete?.();
		});
	}
}
