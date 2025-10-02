/**
 * @author tknight-dev
 */

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
	private callbacks: Map<number, (durationInMs: number) => void>;
	private timesInMS: Map<number, number>;
	private timestampThen: number;

	constructor(timestampNow: number = performance.now() | 0) {
		this.added = new Map();
		this.callbacks = new Map();
		this.timesInMS = new Map();
		this.timestampThen = timestampNow;
	}

	/**
	 * @param callback this function is called with the overall duration of the timeout (original duration + clock updates [pauses])
	 * @return id
	 */
	public add(callback: (durationInMs: number) => void, durationInMS: number): number {
		const id: number = ++this.counter;

		this.added.set(id, performance.now() | 0);
		this.callbacks.set(id, callback);
		this.timesInMS.set(id, durationInMS);

		if (id === -1) {
			this.counter = 0;
		}

		return id;
	}

	/**
	 * Process callbacks asynchronously
	 */
	private callback(callbacks: Map<number, (durationInMs: number) => void>, durationInMs: number, id: number): void {
		setTimeout(() => {
			if (callbacks.has(id) === true) {
				callbacks.get(id)(durationInMs);
				callbacks.delete(id);
			}
		});
	}

	public clear(id: number = -1) {
		if (id !== -1) {
			this.timesInMS.delete(id);
			this.callbacks.delete(id);
			this.added.delete(id);
		}
	}

	/**
	 * Update the interal clock without modifying the durations of the internal timer instances (effectively pauses the timers)
	 */
	public clockUpdate(timestampNow: number = performance.now() | 0): void {
		this.timestampThen = timestampNow;
	}

	/**
	 * Check for completed timer instances
	 */
	public tick(timestampNow: number = performance.now() | 0): void {
		if (this.timesInMS.size === 0) {
			this.timestampThen = timestampNow;
			return;
		}

		const delta: number = timestampNow - this.timestampThen;
		if (delta === 0) {
			return;
		}
		this.timestampThen = timestampNow;

		// Process
		let callbacks: Map<number, (durationInMs: number) => void> = this.callbacks,
			durationInMs: number,
			id: number,
			timesInMS: Map<number, number> = this.timesInMS;

		for ([id, durationInMs] of timesInMS.entries()) {
			durationInMs -= delta;

			if (durationInMs <= 0) {
				this.callback(callbacks, timestampNow - this.added.get(id), id);
				this.added.delete(id);
				timesInMS.delete(id);
			} else {
				timesInMS.set(id, durationInMs);
			}
		}
	}

	public getClock(): number {
		return this.timestampThen;
	}
}
