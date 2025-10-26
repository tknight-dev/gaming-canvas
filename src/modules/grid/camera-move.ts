import { GamingCanvasConstPI_2_000 } from '../../main/const.js';
import { GamingCanvasDoubleLinkedList, GamingCanvasDoubleLinkedListNode } from '../../main/double-linked-list.js';
import { GamingCanvasGridICamera } from './camera.js';

/**
 * @author tknight-dev
 */

interface GamingCanvasGridCameraMoveJob extends GamingCanvasGridCameraMoveOptions, GamingCanvasGridCameraMoveJobRequest {
	durationCompletedInMs: number;
	id: number;
	rOriginal: number;
	timestamp: number;
	xOriginal: number;
	xStep: number;
	yOriginal: number;
	yStep: number;
	zOriginal: number;
	zStep: number;
}

export interface GamingCanvasGridCameraMoveOptions {
	xPositionType?: GamingCanvasGridCameraMoveOptionsPositionType;
	yPositionType?: GamingCanvasGridCameraMoveOptionsPositionType;
	zPositionType?: GamingCanvasGridCameraMoveOptionsPositionType;
}

export enum GamingCanvasGridCameraMoveOptionsPositionType {
	ABSOLUTE,
	RELATIVE,
}

interface GamingCanvasGridCameraMoveJobRequest {
	callback?: (camera: GamingCanvasGridICamera) => void;
	camera: GamingCanvasGridICamera;
	durationInMs: number;
	r: number;
	x: number;
	y: number;
	z: number;
}

/**
 * @param callback is triggered on completion
 * @return is null if the durationInMs is <= 0 as the move is done immediately
 */
export const GamingCanvasGridCameraMove = (
	camera: GamingCanvasGridICamera,
	r: number,
	x: number,
	y: number,
	z: number,
	durationInMs: number,
	options: GamingCanvasGridCameraMoveOptions = {},
	callback?: (camera: GamingCanvasGridICamera) => void,
): number | null => {
	// Options
	options.xPositionType === undefined && (options.xPositionType = GamingCanvasGridCameraMoveOptionsPositionType.ABSOLUTE);
	options.yPositionType === undefined && (options.yPositionType = GamingCanvasGridCameraMoveOptionsPositionType.ABSOLUTE);
	options.zPositionType === undefined && (options.zPositionType = GamingCanvasGridCameraMoveOptionsPositionType.ABSOLUTE);

	// Apply now or submit to workload
	if (durationInMs <= 0) {
		camera.r += r;
		camera.x = options.xPositionType === GamingCanvasGridCameraMoveOptionsPositionType.ABSOLUTE ? x : camera.x + x;
		camera.y = options.xPositionType === GamingCanvasGridCameraMoveOptionsPositionType.ABSOLUTE ? y : camera.y + y;
		camera.z = options.xPositionType === GamingCanvasGridCameraMoveOptionsPositionType.ABSOLUTE ? z : camera.z + z;

		if (callback !== undefined) {
			setTimeout(() => {
				callback(camera);
			});
		}

		return null;
	} else {
		return GamingCanvasGridCameraMoveLoop.add(
			{
				callback: callback,
				camera: camera,
				durationInMs: durationInMs,
				r: r,
				x: x,
				y: y,
				z: z,
			},
			options,
		);
	}
};

class GamingCanvasGridCameraMoveLoop {
	public static fpms: number = 1000 / 60; // 60FPS default
	public static idCounter: number = 0;
	public static ids: Map<number, GamingCanvasDoubleLinkedListNode<GamingCanvasGridCameraMoveJob>> = new Map();
	public static loopAutomatic: boolean = true;
	public static request: number | undefined;
	public static timestampPause: number;
	public static work: GamingCanvasDoubleLinkedList<GamingCanvasGridCameraMoveJob> = new GamingCanvasDoubleLinkedList();

	static {
		GamingCanvasGridCameraMoveLoop.loop__funcForward();
	}

	public static add(request: GamingCanvasGridCameraMoveJobRequest, options: GamingCanvasGridCameraMoveOptions): number {
		const job: GamingCanvasGridCameraMoveJob = <GamingCanvasGridCameraMoveJob>Object.assign(request, options);

		// Add basics
		job.durationCompletedInMs = 0;
		job.rOriginal = request.camera.r;
		job.timestamp = performance.now();
		job.xOriginal = request.camera.x;
		job.yOriginal = request.camera.y;
		job.zOriginal = request.camera.z;

		// Calc: X
		if (job.xPositionType === GamingCanvasGridCameraMoveOptionsPositionType.RELATIVE) {
			job.x += job.xOriginal;
			job.xPositionType = GamingCanvasGridCameraMoveOptionsPositionType.ABSOLUTE;
		}
		job.xStep = job.xOriginal - job.x;

		// Calc: Y
		if (job.yPositionType === GamingCanvasGridCameraMoveOptionsPositionType.RELATIVE) {
			job.y += job.yOriginal;
			job.yPositionType = GamingCanvasGridCameraMoveOptionsPositionType.ABSOLUTE;
		}
		job.yStep = job.yOriginal - job.y;

		// Calc: Z
		if (job.zPositionType === GamingCanvasGridCameraMoveOptionsPositionType.RELATIVE) {
			job.z += job.zOriginal;
			job.zPositionType = GamingCanvasGridCameraMoveOptionsPositionType.ABSOLUTE;
		}
		job.zStep = job.zOriginal - job.z;

		// Done
		job.id = GamingCanvasGridCameraMoveLoop.idCounter++;
		while (GamingCanvasGridCameraMoveLoop.ids.has(job.id) === true) {
			job.id = GamingCanvasGridCameraMoveLoop.idCounter++;
		}
		GamingCanvasGridCameraMoveLoop.ids.set(job.id, GamingCanvasGridCameraMoveLoop.work.pushEnd(job));

		// Start animation loop if not already running
		if (GamingCanvasGridCameraMoveLoop.loopAutomatic === true && GamingCanvasGridCameraMoveLoop.request === undefined) {
			GamingCanvasGridCameraMoveLoop.request = requestAnimationFrame(GamingCanvasGridCameraMoveLoop.loop);
		}

		return job.id;
	}

	public static loop(_timestampNow: number, _tick?: boolean): void {}
	public static loop__funcForward(): void {
		let calcPercentComplete: number,
			fpms: number = GamingCanvasGridCameraMoveLoop.fpms,
			ids: Map<number, GamingCanvasDoubleLinkedListNode<GamingCanvasGridCameraMoveJob>> = GamingCanvasGridCameraMoveLoop.ids,
			instance: GamingCanvasDoubleLinkedListNode<GamingCanvasGridCameraMoveJob> | undefined,
			job: GamingCanvasGridCameraMoveJob,
			loopAutomatic: boolean = GamingCanvasGridCameraMoveLoop.loopAutomatic,
			timestampDelta: number,
			timestampThen: number = 0,
			work: GamingCanvasDoubleLinkedList<GamingCanvasGridCameraMoveJob> = GamingCanvasGridCameraMoveLoop.work;

		const done = (job: GamingCanvasGridCameraMoveJob): void => {
			setTimeout(() => {
				// Adjust rotation to match unit circle (0 <-> 2pi)
				if (job.camera.r < 0) {
					job.camera.r %= GamingCanvasConstPI_2_000;

					if (job.camera.r === 0) {
						// Fixes -0 values ... lol javascript...
						job.camera.r = 0;
					} else {
						job.camera.r += GamingCanvasConstPI_2_000;
					}
				} else if (job.camera.r >= GamingCanvasConstPI_2_000) {
					job.camera.r %= GamingCanvasConstPI_2_000;

					if (job.camera.r === GamingCanvasConstPI_2_000) {
						job.camera.r = 0;
					}
				}
				job.callback !== undefined && job.callback(job.camera);
			});
		};

		const loop = (timestampNow: number, tick?: boolean) => {
			if (GamingCanvasGridCameraMoveLoop.loopAutomatic !== loopAutomatic) {
				loopAutomatic = GamingCanvasGridCameraMoveLoop.loopAutomatic;
			}
			if (loopAutomatic === true && tick !== true) {
				GamingCanvasGridCameraMoveLoop.request = requestAnimationFrame(loop);
			}

			timestampDelta = timestampNow - timestampThen;
			if (tick === true || timestampDelta > fpms) {
				timestampThen = timestampNow - (timestampDelta % fpms);

				// Settings
				if (fpms !== GamingCanvasGridCameraMoveLoop.fpms) {
					fpms = GamingCanvasGridCameraMoveLoop.fpms;
				}

				// Work
				for (instance of work) {
					if (instance === undefined) {
						continue;
					}
					job = instance.data;

					// Calc: Timing
					job.durationCompletedInMs = timestampNow - job.timestamp;
					calcPercentComplete = Math.min(1, job.durationCompletedInMs / job.durationInMs);

					// Calc: R, X, Y, and Z (always absolute)
					job.camera.r = job.rOriginal + job.r * calcPercentComplete;
					job.camera.x = job.xOriginal - job.xStep * calcPercentComplete;
					job.camera.y = job.yOriginal - job.yStep * calcPercentComplete;
					job.camera.z = job.zOriginal - job.zStep * calcPercentComplete;

					// Time
					if (job.durationCompletedInMs >= job.durationInMs) {
						ids.delete(job.id);
						work.remove(instance);

						done(job);
					}
				}

				// Done
				if (loopAutomatic === true && ids.size === 0 && tick !== true) {
					cancelAnimationFrame(<number>GamingCanvasGridCameraMoveLoop.request);
					GamingCanvasGridCameraMoveLoop.request = undefined;
				}
			}
		};
		GamingCanvasGridCameraMoveLoop.loop = loop;
	}
}

export const GamingCanvasGridCameraMoveCancel = (id: number): void => {
	const node: GamingCanvasDoubleLinkedListNode<GamingCanvasGridCameraMoveJob> | undefined = GamingCanvasGridCameraMoveLoop.ids.get(id);

	if (node !== undefined) {
		GamingCanvasGridCameraMoveLoop.ids.delete(id);
		GamingCanvasGridCameraMoveLoop.work.remove(node);

		if (GamingCanvasGridCameraMoveLoop.ids.size === 0) {
			GamingCanvasGridCameraMoveLoop.request = undefined;
		}
	}
};

/**
 * Only works when loop is in automatic mode
 */
export const GamingCanvasGridCameraMovePause = (pause: boolean): void => {
	if (GamingCanvasGridCameraMoveLoop.loopAutomatic === true) {
		if (pause === true) {
			// Stop animation loop if running
			if (GamingCanvasGridCameraMoveLoop.request !== undefined) {
				cancelAnimationFrame(GamingCanvasGridCameraMoveLoop.request);
				GamingCanvasGridCameraMoveLoop.timestampPause = performance.now();
			}
		} else {
			// Start animation loop if work available
			if (GamingCanvasGridCameraMoveLoop.ids.size !== 0) {
				let delta: number = performance.now() - GamingCanvasGridCameraMoveLoop.timestampPause,
					instance: GamingCanvasDoubleLinkedListNode<GamingCanvasGridCameraMoveJob> | undefined;

				for (instance of GamingCanvasGridCameraMoveLoop.work) {
					if (instance === undefined) {
						continue;
					}

					instance.data.timestamp += delta;
				}

				GamingCanvasGridCameraMoveLoop.request = requestAnimationFrame(GamingCanvasGridCameraMoveLoop.loop);
			}
		}
	}
};

/**
 * @param automatic if false then GamingCanvasGridCameraMoveTick() will need to be called by your code
 */
export const GamingCanvasGridCameraMoveLoopAutomatic = (automatic: boolean): void => {
	GamingCanvasGridCameraMoveLoop.loopAutomatic = automatic;
};

/**
 * FPS of 0 is automatically converted to 1000FPS
 *
 * @param fps [1-1000]
 */
export const GamingCanvasGridCameraMoveFPS = (fps: number): void => {
	GamingCanvasGridCameraMoveLoop.fpms = (fps || 0) === 0 ? 1 : 1000 / Math.max(1, Math.min(1000, fps));
};

/**
 * Calls the interal logic regardless of whether or not the loop is in automatic
 */
export const GamingCanvasGridCameraMoveTick = (): void => {
	if (GamingCanvasGridCameraMoveLoop.ids.size !== 0) {
		GamingCanvasGridCameraMoveLoop.loop(performance.now(), true);
	}
};

export const GamingCanvasGridCameraMoveWorkAvailable = (): boolean => {
	return GamingCanvasGridCameraMoveLoop.ids.size !== 0;
};
