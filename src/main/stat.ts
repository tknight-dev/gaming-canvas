/**
 * Statistical analysis stuff
 *
 * @author tknight-dev
 */

export enum GamingCanvasStatCalcType {
	AVERAGE, //Median
	MAX,
	MIN,
	QUARTILE,
	STD_DEV,
	SUM,
}

export enum GamingCanvasStatCalcPrecision {
	_16,
	_32,
	_64,
}

export interface GamingCanvasStatQuartile {
	q0: number;
	q1: number;
	q2: number;
	q3: number;
	q4: number;
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
	 * Samples determines how many values can be stored at one time: the more samples, the more cpu/memory, and the more accurate the measurement
	 *
	 * @param samples can be an array of data (also sets sample size to array length) or the number of samples you want the stat to contain
	 */
	constructor(samples: number | number[] = 5) {
		this.index = 0;

		if (Array.isArray(samples) === true) {
			this.data = samples;
			this.size = samples.length;
		} else {
			this.data = new Array(samples);
			this.size = 0;
		}
	}

	/**
	 * Manually add your own value
	 */
	public add(value: number): void {
		this.data[this.index++] = value;
		this.size = Math.min(this.size + 1, this.data.length);

		// Reset array index back to start
		if (this.index !== 0 && this.index % this.data.length === 0) {
			this.index = 0;
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
	public static calc(stat: GamingCanvasStat, type: GamingCanvasStatCalcType = GamingCanvasStatCalcType.AVERAGE): number | GamingCanvasStatQuartile {
		const data: number[] = stat.data,
			size: number = Math.min(data.length, stat.size);

		if (size !== 0) {
			let value: number;

			switch (type) {
				case GamingCanvasStatCalcType.AVERAGE: // median
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
				case GamingCanvasStatCalcType.QUARTILE:
					const dataAscending: number[] = data.sort((a, b) => a - b);
					let base: number, position: number;

					const calc = (quintile: number) => {
						position = (dataAscending.length - 1) * quintile;
						base = position | 0;

						if (dataAscending[base + 1] !== undefined) {
							return dataAscending[base] + (position - base) * (dataAscending[base + 1] - dataAscending[base]);
						} else {
							return dataAscending[base];
						}
					};

					return {
						q0: calc(0),
						q1: calc(0.25),
						q2: calc(0.5),
						q3: calc(0.75),
						q4: calc(1),
					};
				case GamingCanvasStatCalcType.STD_DEV:
					const mean: number = data.reduce((a, b) => a + b) / data.length;
					return Math.sqrt(data.map((x) => (x - mean) ** 2).reduce((a, b) => a + b) / data.length);
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
			if (type === GamingCanvasStatCalcType.QUARTILE) {
				return {
					q0: 0,
					q1: 0,
					q2: 0,
					q3: 0,
					q4: 0,
				};
			} else {
				return 0;
			}
		}
	}

	/**
	 * Resets back to original state
	 */
	public clear(): void {
		this.index = 0;
		this.size = 0;
	}

	/**
	 * Returns a GamingCanvasStat instance from an encoded GamingCanvasStat (Float Array)
	 */
	public static decode(data: Float16Array | Float32Array | Float64Array): GamingCanvasStat {
		let i = 0,
			max: number = data.length - 1,
			array: number[] = new Array(data[max]),
			stat: GamingCanvasStat = new GamingCanvasStat(data[max]);

		stat.data = array;
		if (array.length !== 0 && array.length % max !== 0) {
			stat.index = array.length;
		}
		stat.size = array.length;

		for (; i < max; i++) {
			array[i] = data[i];
		}

		return stat;
	}

	/**
	 * Returns a Typed Array (TransferableObject) with the last element representing the original sample size
	 */
	public encode(precision: GamingCanvasStatCalcPrecision = GamingCanvasStatCalcPrecision._32): Float16Array | Float32Array | Float64Array {
		let array: Float16Array | Float32Array | Float64Array,
			data: number[] = this.data,
			i: number = 0,
			size: number = this.size;

		switch (precision) {
			case GamingCanvasStatCalcPrecision._16:
				array = new Float16Array(this.size + 1);
				break;
			case GamingCanvasStatCalcPrecision._32:
				array = new Float32Array(this.size + 1);
				break;
			case GamingCanvasStatCalcPrecision._64:
				array = new Float64Array(this.size + 1);
				break;
		}

		for (; i < size; i++) {
			array[i] = data[i] || 0;
		}

		array[array.length - 1] = size;

		return array;
	}

	/**
	 * Contained data length
	 */
	public get length(): number {
		return this.size;
	}

	/**
	 * Contained data length matches the requested sample size
	 */
	public isFull(): boolean {
		return this.size === this.data.length;
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
