import { GamingCanvasInputPositionBasic } from '../../main/inputs.js';

/**
 * All (x,y) cooridnates are in terms of cells/tiles unless noted otherwise via the postfix 'px' (pixels)
 *
 * All grids are square
 *
 * @author tknight-dev
 */

interface GamingCanvasGridIArray<T> {
	createDataInstance: () => T;
}

export type GamingCanvasGridType = GamingCanvasGridUint8Array | GamingCanvasGridUint8ClampedArray | GamingCanvasGridUint16Array | GamingCanvasGridUint32Array;

abstract class GamingCanvasGrid<T> {
	public readonly data: T;
	private readonly prefix: string;
	public readonly size: number;
	public readonly sideLength: number;

	constructor(data: T, prefix: string, sideLength: number) {
		this.data = data;
		this.prefix = prefix;
		this.sideLength = sideLength;
		this.size = sideLength * sideLength;
	}

	toJSON() {
		return {
			data: Array.from(<Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array>this.data),
			prefix: this.prefix,
			size: this.size,
			sideLength: this.sideLength,
		};
	}

	public get(x: number, y: number): number | undefined {
		const index: number = (x | 0) * this.sideLength + (y | 0);

		if (index < this.size && index >= 0) {
			return (<Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array>this.data)[index];
		} else {
			console.error(`${this.prefix} > get: x (${x}) and y (${y}) not within grid [sideLength=${this.sideLength}]`);
			return undefined;
		}
	}

	public getBasic(position: GamingCanvasInputPositionBasic): number | undefined {
		const index: number = (position.x | 0) * this.sideLength + (position.y | 0);

		if (index < this.size && index >= 0) {
			return (<Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array>this.data)[index];
		} else {
			console.error(`${this.prefix} > getBasic: x (${position.x}) and y (${position.y}) not within grid [sideLength=${this.sideLength}]`);
			return undefined;
		}
	}

	public set(x: number, y: number, value: number): boolean {
		const index: number = (x | 0) * this.sideLength + (y | 0);

		if (index < this.size && index >= 0) {
			(<Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array>this.data)[index] = value;
			return true;
		} else {
			console.error(`${this.prefix} > set: x (${x}) and y (${y}) not within grid [sideLength=${this.sideLength}]`);
			return false;
		}
	}

	public setBasic(position: GamingCanvasInputPositionBasic, value: number): boolean {
		const index: number = (position.x | 0) * this.sideLength + (position.y | 0);

		if (index < this.size && index >= 0) {
			(<Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array>this.data)[index] = value;
			return true;
		} else {
			console.error(`${this.prefix} > setBasic: x (${position.x}) and y (${position.y}) not within grid [sideLength=${this.sideLength}]`);
			return false;
		}
	}
}

export class GamingCanvasGridUint8Array extends GamingCanvasGrid<Uint8Array> implements GamingCanvasGridIArray<Uint8Array> {
	public apply(data: Uint8Array): void {
		const _data = this.data,
			length: number = Math.min(_data.length, data.length);

		for (let i = 0; i < length; i++) {
			_data[i] = data[i];
		}
	}

	public clone(): GamingCanvasGridUint8Array {
		return GamingCanvasGridUint8Array.from(<Uint8Array>this.data, true);
	}

	constructor(sideLength: number, fill?: number) {
		super(new Uint8Array(sideLength * sideLength), 'GamingCanvasGridUint8Array', sideLength);
		fill !== undefined && this.data.fill(fill);
	}

	/**
	 * Creates new typed array instance based on the current class type
	 */
	public createDataInstance(value?: number | number[] | Set<number>): Uint8Array {
		if (value === undefined) {
			return new Uint8Array();
		} else if (typeof value === 'number') {
			return new Uint8Array(value);
		} else {
			return Uint8Array.from(value);
		}
	}

	/**
	 * @param cloneData true and the interal data object will be a clone. False and it will be the passed in data object.
	 */
	public static from(data: Uint8Array, cloneData?: boolean): GamingCanvasGridUint8Array {
		const grid: GamingCanvasGridUint8Array = new GamingCanvasGridUint8Array(0);
		(<any>grid).data = cloneData === true ? Uint8Array.from(data) : data;
		(<any>grid).sideLength = (data.length ** 0.5) | 0;
		(<any>grid).size = grid.sideLength ** 2;

		return grid;
	}
}

export class GamingCanvasGridUint8ClampedArray extends GamingCanvasGrid<Uint8ClampedArray> implements GamingCanvasGridIArray<Uint8ClampedArray> {
	public apply(data: Uint8ClampedArray): void {
		const _data = this.data,
			length: number = Math.min(_data.length, data.length);

		for (let i = 0; i < length; i++) {
			_data[i] = data[i];
		}
	}

	public clone(): GamingCanvasGridUint8ClampedArray {
		return GamingCanvasGridUint8ClampedArray.from(<Uint8ClampedArray>this.data, true);
	}

	/**
	 * @param fill of 0 is not necessary as the array values are already 0 by the nature of an Uint8ClampedArray
	 */
	public constructor(sideLength: number, fill?: number) {
		super(new Uint8ClampedArray(sideLength * sideLength), 'GamingCanvasGridUint8ClampedArray', sideLength);
		fill !== undefined && this.data.fill(fill);
	}

	/**
	 * Creates new typed array instance based on the current class type
	 */
	public createDataInstance(value?: number | number[] | Set<number>): Uint8ClampedArray {
		if (value === undefined) {
			return new Uint8ClampedArray();
		} else if (typeof value === 'number') {
			return new Uint8ClampedArray(value);
		} else {
			return Uint8ClampedArray.from(value);
		}
	}

	/**
	 * @param cloneData true and the interal data object will be a clone. False and it will be the passed in data object.
	 */
	public static from(data: Uint8ClampedArray, cloneData?: boolean): GamingCanvasGridUint8ClampedArray {
		const grid: GamingCanvasGridUint8ClampedArray = new GamingCanvasGridUint8ClampedArray(0);
		(<any>grid).data = cloneData === true ? Uint8ClampedArray.from(data) : data;
		(<any>grid).sideLength = (data.length ** 0.5) | 0;
		(<any>grid).size = grid.sideLength ** 2;

		return grid;
	}
}

export class GamingCanvasGridUint16Array extends GamingCanvasGrid<Uint16Array> implements GamingCanvasGridIArray<Uint16Array> {
	public apply(data: Uint16Array): void {
		const _data = this.data,
			length: number = Math.min(_data.length, data.length);

		for (let i = 0; i < length; i++) {
			_data[i] = data[i];
		}
	}

	public clone(): GamingCanvasGridUint16Array {
		return GamingCanvasGridUint16Array.from(<Uint16Array>this.data, true);
	}

	public constructor(sideLength: number, fill?: number) {
		super(new Uint16Array(sideLength * sideLength), 'GamingCanvasGridUint16Array', sideLength);
		fill !== undefined && this.data.fill(fill);
	}

	/**
	 * Creates new typed array instance based on the current class type
	 */
	public createDataInstance(value?: number | number[] | Set<number>): Uint16Array {
		if (value === undefined) {
			return new Uint16Array();
		} else if (typeof value === 'number') {
			return new Uint16Array(value);
		} else {
			return Uint16Array.from(value);
		}
	}

	/**
	 * @param cloneData true and the interal data object will be a clone. False and it will be the passed in data object.
	 */
	public static from(data: Uint16Array, cloneData?: boolean): GamingCanvasGridUint16Array {
		const grid: GamingCanvasGridUint16Array = new GamingCanvasGridUint16Array(0);
		(<any>grid).data = cloneData === true ? Uint16Array.from(data) : data;
		(<any>grid).sideLength = (data.length ** 0.5) | 0;
		(<any>grid).size = grid.sideLength ** 2;

		return grid;
	}
}

export class GamingCanvasGridUint32Array extends GamingCanvasGrid<Uint32Array> implements GamingCanvasGridIArray<Uint32Array> {
	public apply(data: Uint8Array): void {
		const _data = this.data,
			length: number = Math.min(_data.length, data.length);

		for (let i = 0; i < length; i++) {
			_data[i] = data[i];
		}
	}

	public clone(): GamingCanvasGridUint32Array {
		return GamingCanvasGridUint32Array.from(<Uint32Array>this.data, true);
	}

	public constructor(sideLength: number, fill?: number) {
		super(new Uint32Array(sideLength * sideLength), 'GamingCanvasGridUint32Array', sideLength);
		fill !== undefined && this.data.fill(fill);
	}

	/**
	 * Creates new typed array instance based on the current class type
	 */
	public createDataInstance(value?: number | number[] | Set<number>): Uint32Array {
		if (value === undefined) {
			return new Uint32Array();
		} else if (typeof value === 'number') {
			return new Uint32Array(value);
		} else {
			return Uint32Array.from(value);
		}
	}

	/**
	 * @param cloneData true and the interal data object will be a clone. False and it will be the passed in data object.
	 */
	public static from(data: Uint32Array, cloneData?: boolean): GamingCanvasGridUint32Array {
		const grid: GamingCanvasGridUint32Array = new GamingCanvasGridUint32Array(0);
		(<any>grid).data = cloneData === true ? Uint32Array.from(data) : data;
		(<any>grid).sideLength = (data.length ** 0.5) | 0;
		(<any>grid).size = grid.sideLength ** 2;

		return grid;
	}
}
