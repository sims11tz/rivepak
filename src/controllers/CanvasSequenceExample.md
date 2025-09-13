import { CanvasSequenceManager } from "./canvasSequenceManager";
import { EASING_TYPE, ANIMATION_TYPE } from "./CanvasSequence";
import { CanvasObj } from "@sims11tz/rivpak";

// Example sequences for common animations

export class ExampleSequences
{
	// Bounce in from small to normal size
	public static BounceIn(target:CanvasObj, finalScale:number = 1, duration:number = 1000):void
	{
		const seq = CanvasSequenceManager.get().CreateSequence(target, `bounceIn_${target.uuid}`);
		seq
			.AddScale(0.1, 0.1, 0) // Start tiny instantly
			.AddScale(finalScale, finalScale, duration, EASING_TYPE.BOUNCE_OUT)
			.Play();
	}

	// Spring in with both scales animating in parallel
	public static SpringIn(target:CanvasObj, finalScale:number = 1, stiffness:number = 400, damping:number = 20):void
	{
		const seq = CanvasSequenceManager.get().CreateSequence(target, `springIn_${target.uuid}`);
		seq
			.AddScale(0.1, 0.1, 0) // Start tiny instantly
			.Add({
				actions: [
					{
						property: "xScale",
						targetValue: finalScale,
						animationType: ANIMATION_TYPE.SPRING,
						stiffness: stiffness,
						damping: damping
					},
					{
						property: "yScale",
						targetValue: finalScale,
						animationType: ANIMATION_TYPE.SPRING,
						stiffness: stiffness,
						damping: damping
					}
				]
			})
			.Play();
	}

	// Elastic pop effect
	public static ElasticPop(target:CanvasObj, overshoot:number = 1.2, finalScale:number = 1):void
	{
		const seq = CanvasSequenceManager.get().CreateSequence(target, `elasticPop_${target.uuid}`);
		seq
			.AddScale(0, 0, 0) // Start at zero
			.AddSpring("xScale", overshoot * finalScale, 200, 10) // Overshoot
			.AddSpring("yScale", overshoot * finalScale, 200, 10)
			.AddSpring("xScale", finalScale, 300, 20) // Settle back
			.AddSpring("yScale", finalScale, 300, 20)
			.Play();
	}

	// Staggered appearance for multiple objects
	public static StaggeredAppear(targets:CanvasObj[], staggerDelay:number = 100, finalScale:number = 1):void
	{
		targets.forEach((target, index) => {
			const seq = CanvasSequenceManager.get().CreateSequence(target, `stagger_${target.uuid}`);
			seq
				.AddScale(0, 0, 0) // Start invisible
				.AddDelay(index * staggerDelay) // Stagger delay
				.Add({
					actions: [
						{
							property: "xScale",
							targetValue: finalScale,
							animationType: ANIMATION_TYPE.SPRING,
							stiffness: 400,
							damping: 25
						},
						{
							property: "yScale",
							targetValue: finalScale,
							animationType: ANIMATION_TYPE.SPRING,
							stiffness: 400,
							damping: 25
						}
					]
				})
				.Play();
		});
	}
}
