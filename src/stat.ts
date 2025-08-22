/**
 * Statistical analysis stuff
 *
 * @author tknight-dev
 */

export enum GamingCanvasStatCalcType {
	AVERAGE,
	MAX,
	MIN,
	SUM,
}

/**
 * Measure the performance of your algorithms to gauge where you need/want to improve
 */
export class GamingCanvasStat {
	private data: number[];
	private index: number;
	private size: number;
	private timer: number;

	/**
	 * Default sample size is 5
	 *
	 * @param samples determines how many timing durations can be stored at one time: the more samples, the more cpu/memory, and the more accurate the measurement
	 */
	constructor(samples: number = 5) {
		this.data = new Array(Math.max(1, samples));
		this.index = 0;
		this.size = 0;
	}

	/**
	 * Manually add your own value
	 */
	public add(value: number): void {
		this.data[this.index++] = value;

		if (this.index !== 0 && this.index % this.data.length === 0) {
			// Apply value to the starting element of the array
			this.index = 0;
			this.size = this.data.length;
		} else {
			// Apply value to the next element of the array
			this.size++;
		}
	}

	/**
	 * If samples is 100, but there is only 1 reading. Then you'll get just that 1 reading.
	 *
	 * If samples is 100, but there is only 2 readings. Then you'll get just the calc of those 2 readings.
	 *
	 * @param type default is average
	 *
	 * @return is 0 on no data available
	 */
	public static calc(stat: GamingCanvasStat, type: GamingCanvasStatCalcType = GamingCanvasStatCalcType.AVERAGE): number {
		const data: number[] = stat.data,
			size: number = Math.min(data.length, stat.size);

		if (size !== 0) {
			let value: number;

			switch (type) {
				case GamingCanvasStatCalcType.AVERAGE:
					value = 0;
					for (let i = 0; i < size; i++) {
						value += data[i];
					}
					return value / size;
				case GamingCanvasStatCalcType.MAX:
					value = data[0];
					for (let i = 1; i < size; i++) {
						if (data[i] > value) {
							value = data[i];
						}
					}
					return value;
				case GamingCanvasStatCalcType.MIN:
					value = data[0];
					for (let i = 1; i < size; i++) {
						if (data[i] < value) {
							value = data[i];
						}
					}
					return value;
				case GamingCanvasStatCalcType.SUM:
					value = 0;
					for (let i = 0; i < size; i++) {
						value += data[i];
					}
					return value;
				default:
					console.error('GamingCanvasStat > calc: unknown type', type);
					return 0;
			}
		} else {
			return 0;
		}
	}

	/**
	 * Resets back to original state
	 */
	public clear(): void {
		this.index = 0;
		this.size = 0;
	}

	public getSamples(): number {
		return this.data.length;
	}

	/**
	 * Resets back to original state
	 *
	 * @param samples determines how many timing durations can be stored at one time: the more samples, the more cpu/memory, and the more accurate the measurement
	 */
	public setSamples(samples: number): void {
		this.data = new Array(Math.max(1, samples));
		this.index = 0;
		this.size = 0;
	}

	/**
	 * Tracks the timing of an algorithm in milliseconds: start the clock
	 */
	public watchStart(): void {
		this.timer = performance.now();
	}

	/**
	 * Tracks the timing of an algorithm in milliseconds: stop the clock and add the duration to the internal array
	 */
	public watchStop(): void {
		this.add(performance.now() - this.timer);
	}
}
