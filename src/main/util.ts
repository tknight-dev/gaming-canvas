/**
 * @author tknight-dev
 */

import { GamingCanvasConstPI_2_000 } from './const.js';

/**
 * Dynamically increase array size without disturbing existing values
 *
 * Will catch browser errors if the increase request is too large, and will scale down the job into smaller segments
 *
 * @param increaseBy defines how much longer the array should be
 * @param fill remember that filling an array with an object will just put pointers to that same object in all the array elements
 */
export const GamingCanvasUtilArrayExpand = (array: any[], increaseBy: number, fill?: any): any[] => {
	if (increaseBy > 0) {
		try {
			// Error thrown if increasing array size by too much at one time (browser dependent)
			Array.prototype.push.apply(array, new Array(increaseBy).fill(fill));
			return array;
		} catch (error) {
			// Reduce increase size and try again
			const reducer: number = (increaseBy / 2) | 0;

			while (increaseBy > 0) {
				GamingCanvasUtilArrayExpand(array, Math.min(reducer, increaseBy));
				increaseBy -= reducer;
			}

			return array;
		}
	} else {
		return array;
	}
};

/**
 * Generates a simple image for verifying your render logic
 */
export const GamingCanvasUtilDebugImage = (width: number, height?: number): OffscreenCanvas => {
	width = width | 0;
	height = height === undefined ? width : height | 0;

	const canvas: OffscreenCanvas = new OffscreenCanvas(width, height),
		context: OffscreenCanvasRenderingContext2D = <OffscreenCanvasRenderingContext2D>canvas.getContext('2d'),
		heightHalf: number = (height / 2) | 0,
		minHalf: number = (Math.min(height, width) / 2) | 0,
		widthHalf: number = (width / 2) | 0;

	canvas.height = height;
	canvas.width = width;

	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = 'rgb(224,224,224)';
	context.fillRect(0, 0, width, height);

	context.fillStyle = 'red';
	context.fillRect(0, 0, minHalf, minHalf);

	context.fillStyle = 'blue';
	context.fillRect(width - minHalf, height - minHalf, minHalf, minHalf);

	context.fillStyle = 'green';
	context.beginPath();
	context.arc(widthHalf, heightHalf, minHalf / 2, 0, GamingCanvasConstPI_2_000);
	context.closePath();
	context.fill();

	return canvas;
};

/**
 * Scale value between two ranges
 *
 * EG: value = 8
 * 		fromMin = 0, fromMax = 10
 * 		  toMin = 0,   toMax = 100
 * 		return is 80
 */
export const GamingCanvasUtilScale = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) => {
	return ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
};

/**
 * A simple alternative for `setTimeout()` that gives you more control over the clock checking and timing calculations
 *
 * Note: timing accuracy depends on the thread calling it (typically less accurate then just using `setTimeout()`)
 *
 * Note: non-static class as WebWorkers have their own `performance.now()` initial time (0 reference) that is unique to the WebWorker instant
 * 	of instantiation. Thus, every new instance of this class will be relative to the thread that created it
 */
export class GamingCanvasUtilTimers {
	private added: Map<number, number>;
	private counter: number = -1;
	private callbacks: Map<number, (durationInMs: number, id: number) => void>;
	private timesInMSRemaining: Map<number, number>; // track the current duration of each callback instance
	private timesInMSRequested: Map<number, number>; // track the request duration of each callback instance
	private timestampThen: number;

	constructor(timestampNow: number = performance.now()) {
		this.added = new Map();
		this.callbacks = new Map();
		this.timesInMSRemaining = new Map();
		this.timesInMSRequested = new Map();
		this.timestampThen = timestampNow;
	}

	/**
	 * Auto incrementing ids roll over to 0 when the maximum numerical value is used by the system
	 *
	 * @param callback this function is called with the overall duration of the timeout (original duration + clock updates [pauses])
	 * @param id any value less than 0 is safe. Any positive value may get overridden by the auto incrementer
	 * @return id
	 */
	public add(callback: (durationInMs: number, id: number) => void, durationInMS: number, id?: number): number {
		if (id === undefined) {
			// Auto ID incrementor
			id = ++this.counter;

			if (id < 0) {
				id = 0;
				this.counter = -1;
			}
		}

		this.added.set(id, performance.now());
		this.callbacks.set(id, callback);
		this.timesInMSRemaining.set(id, durationInMS);
		this.timesInMSRequested.set(id, durationInMS);

		return id;
	}

	/**
	 * Process callbacks asynchronously
	 */
	private callback(callbacks: Map<number, (durationInMs: number, id: number) => void>, durationInMs: number, id: number): void {
		setTimeout(() => {
			let callback: ((durationInMs: number, id: number) => void) | undefined = callbacks.get(id);

			if (callback !== undefined) {
				callback(durationInMs, id);
				callbacks.delete(id);
			}
		});
	}

	public clear(id: number = -1) {
		if (id !== -1) {
			this.timesInMSRemaining.delete(id);
			this.timesInMSRequested.delete(id);
			this.callbacks.delete(id);
			this.added.delete(id);
		}
	}

	public clearAll() {
		this.added.clear();
		this.callbacks.clear();
		this.timesInMSRemaining.clear();
		this.timesInMSRequested.clear();
	}

	/**
	 * Update the interal clock without modifying the durations of the internal timer instances (effectively pauses the timers)
	 */
	public clockUpdate(timestampNow: number = performance.now()): void {
		this.timestampThen = timestampNow;
	}

	public reset() {
		this.clearAll();
	}

	/**
	 * Check for completed timer instances
	 */
	public tick(timestampNow: number = performance.now()): void {
		if (this.timesInMSRemaining.size === 0) {
			this.timestampThen = timestampNow;
			return;
		}

		const delta: number = timestampNow - this.timestampThen;
		if (delta <= 0) {
			return;
		}
		this.timestampThen = timestampNow;

		// Process
		let added: Map<number, number> = this.added,
			callbacks: Map<number, (durationInMs: number, id: number) => void> = this.callbacks,
			durationInMs: number,
			id: number,
			timesInMSRemaining: Map<number, number> = this.timesInMSRemaining;

		for ([id, durationInMs] of timesInMSRemaining.entries()) {
			durationInMs -= delta;

			if (durationInMs <= 0) {
				this.callback(callbacks, timestampNow - <number>added.get(id), id);
				added.delete(id);
				this.timesInMSRequested.delete(id);
				timesInMSRemaining.delete(id);
			} else {
				timesInMSRemaining.set(id, durationInMs);
			}
		}
	}

	public getClock(): number {
		return this.timestampThen;
	}

	/**
	 * Remaining time in miliseconds before the callback is triggered
	 */
	public getTimeRemaining(id: number): number | undefined {
		return this.timesInMSRemaining.get(id);
	}

	/**
	 * @return true if timer instance updated
	 */
	public setTimeRemaining(id: number, durationInMs: number): boolean {
		if (this.timesInMSRemaining.has(id) === true) {
			this.timesInMSRemaining.set(id, durationInMs);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * The originally requested duration of a timer instance
	 */
	public getTimeRequested(id: number): number | undefined {
		return this.timesInMSRequested.get(id);
	}
}
