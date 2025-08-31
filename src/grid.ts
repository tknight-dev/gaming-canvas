import { GamingCanvasOrientation, GamingCanvasReport } from './models.js';
import { GamingCanvasUtilScale } from './util.js';

/**
 * Grids are still an experimental concept within the GamingCanvas
 *
 * All (x,y) cooridnates are in terms of cells/tiles unless noted other by comment of 'px' (pixels)
 *
 * All grids are square
 *
 * @author tknight-dev
 */

type GamingCanvasGridType = Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array;

abstract class GamingCanvasGrid<GamingCanvasGridType> {
	public readonly data: GamingCanvasGridType;
	private readonly prefix: string;
	public readonly size: number;
	public readonly sideLength: number;

	constructor(data: GamingCanvasGridType, prefix: string, sideLength: number) {
		this.data = data;
		this.prefix = prefix;
		this.sideLength = sideLength;
		this.size = sideLength * sideLength;
	}

	public get(x: number, y: number): number | undefined {
		const index: number = (x | 0) * this.sideLength + (y | 0);

		if (index >= 0 && index < this.size) {
			return this.data[index];
		} else {
			console.error(`${this.prefix} > get: x (${x}) and y (${y}) not within grid [sideLength=${this.sideLength}]`);
			return undefined;
		}
	}

	public set(value: number, x: number, y: number): boolean {
		const index: number = (x | 0) * this.sideLength + (y | 0);

		if (index >= 0 && index < this.size) {
			this.data[index] = value;
			return true;
		} else {
			console.error(`${this.prefix} > set: x (${x}) and y (${y}) not within grid [sideLength=${this.sideLength}]`);
			return false;
		}
	}
}

export class GamingCanvasGridUint8Array extends GamingCanvasGrid<Uint8Array> {
	public apply(data: Uint8Array): void {
		const _data = this.data,
			length: number = Math.min(_data.length, data.length);

		for (let i = 0; i < length; i++) {
			_data[i] = data[i];
		}
	}

	public clone(): Uint8Array {
		return Uint8Array.from(this.data);
	}

	constructor(sideLength: number) {
		super(new Uint8Array(sideLength * sideLength), 'GamingCanvasGridUint8Array', sideLength);
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

export class GamingCanvasGridUint8ClampedArray extends GamingCanvasGrid<Uint8ClampedArray> {
	public apply(data: Uint8ClampedArray): void {
		const _data = this.data,
			length: number = Math.min(_data.length, data.length);

		for (let i = 0; i < length; i++) {
			_data[i] = data[i];
		}
	}

	public clone(): Uint8ClampedArray {
		return Uint8ClampedArray.from(this.data);
	}

	public constructor(sideLength: number) {
		super(new Uint8ClampedArray(sideLength * sideLength), 'GamingCanvasGridUint8ClampedArray', sideLength);
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

export class GamingCanvasGridUint16Array extends GamingCanvasGrid<Uint16Array> {
	public constructor(sideLength: number) {
		super(new Uint16Array(sideLength * sideLength), 'GamingCanvasGridUint16Array', sideLength);
	}

	public apply(data: Uint16Array): void {
		const _data = this.data,
			length: number = Math.min(_data.length, data.length);

		for (let i = 0; i < length; i++) {
			_data[i] = data[i];
		}
	}

	public clone(): Uint16Array {
		return Uint16Array.from(this.data);
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

export class GamingCanvasGridUint32Array extends GamingCanvasGrid<Uint32Array> {
	public apply(data: Uint8Array): void {
		const _data = this.data,
			length: number = Math.min(_data.length, data.length);

		for (let i = 0; i < length; i++) {
			_data[i] = data[i];
		}
	}

	public constructor(sideLength: number) {
		super(new Uint32Array(sideLength * sideLength), 'GamingCanvasGridUint32Array', sideLength);
	}

	public clone(): Uint32Array {
		return Uint32Array.from(this.data);
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

/**
 * Camera is a pointer with coordinates, rotation, and zoom
 */
export class GamingCanvasGridCamera {
	public r: number; // float: rotation in radians
	public x: number; // float
	public y: number; // float
	public z: number; // float: zoom

	public constructor(r: number = (90 * Math.PI) / 180, x: number = 0, y: number = 0, z: number = 1) {
		this.r = r;
		this.x = x;
		this.y = y;
		this.z = z;
	}

	public decode(data: Float32Array): GamingCanvasGridCamera {
		this.r = data[0];
		this.x = data[1];
		this.y = data[2];
		this.z = data[3];

		return this;
	}

	public encode(): Float32Array {
		return Float32Array.from([this.r, this.x, this.y, this.z]);
	}

	/**
	 * Create a new instance from an encoded GridCamera
	 */
	public static from(data: Float32Array): GamingCanvasGridCamera {
		return new GamingCanvasGridCamera().decode(data);
	}
}

/**
 * Viewport is a reduced view of the overall data grid. Use this when moving the camera or zooming in and out.
 */
export class GamingCanvasGridViewport {
	public cameraZScaleMax: number; // float
	public cellSizePx: number; // float
	public gridSideLength: number; // int
	public height: number; // float
	public heightPx: number; // int
	public heightStart: number; // float
	public heightStartPx: number; // float
	public heightStop: number; // float
	public heightStopPx: number; // float
	public width: number; // float
	public widthPx: number; // int
	public widthStart: number; // float
	public widthStartPx: number; // float
	public widthStop: number; // float
	public widthStopPx: number; // float

	public constructor(cameraZScaleMax: number, sideLength: number) {
		this.cameraZScaleMax = cameraZScaleMax;
		this.gridSideLength = sideLength;
	}

	/**
	 * @param cameraFitToView if true, modifies the camera object as required to fit within the viewport
	 */
	public apply(camera: GamingCanvasGridCamera, cameraFitToView?: boolean): void {
		// Viewport: height + position bounded
		this.heightStart = camera.y - this.height / 2;
		if (cameraFitToView === true) {
			if (this.heightStart < 0) {
				camera.y = this.height / 2;

				this.heightStart = 0;
				this.heightStartPx = 0;

				this.heightStop = this.height;
				this.heightStopPx = this.heightStop * this.cellSizePx;
			} else if (this.heightStart + this.height > this.gridSideLength) {
				camera.y = this.gridSideLength - this.height / 2;

				this.heightStop = this.gridSideLength;
				this.heightStopPx = this.heightStop * this.cellSizePx;

				this.heightStart = this.heightStop - this.height;
				this.heightStartPx = this.heightStart * this.cellSizePx;
			} else {
				this.heightStartPx = this.heightStart * this.cellSizePx;
				this.heightStop = this.heightStart + this.height;
				this.heightStopPx = this.heightStop * this.cellSizePx;
			}
		} else {
			camera.y = Math.max(-this.height * 2, Math.min(this.height * 2, camera.y));

			this.heightStartPx = this.heightStart * this.cellSizePx;
			this.heightStop = this.heightStart + this.height;
			this.heightStopPx = this.heightStop * this.cellSizePx;
		}

		// Viewport: width + position bounded
		this.widthStart = camera.x - this.width / 2;
		if (cameraFitToView === true) {
			if (this.widthStart < 0) {
				camera.x = this.width / 2;

				this.widthStart = 0;
				this.widthStartPx = 0;

				this.widthStop = this.width;
				this.widthStopPx = this.widthStop * this.cellSizePx;
			} else if (this.widthStart + this.width > this.gridSideLength) {
				camera.x = this.gridSideLength - this.width / 2;

				this.widthStop = this.gridSideLength;
				this.widthStopPx = this.widthStop * this.cellSizePx;

				this.widthStart = this.widthStop - this.width;
				this.widthStartPx = this.widthStart * this.cellSizePx;
			} else {
				this.widthStartPx = this.widthStart * this.cellSizePx;
				this.widthStop = this.widthStart + this.width;
				this.widthStopPx = this.widthStop * this.cellSizePx;
			}
		} else {
			this.widthStartPx = this.widthStart * this.cellSizePx;
			this.widthStop = this.widthStart + this.width;
			this.widthStopPx = this.widthStop * this.cellSizePx;
		}
	}

	public applyZ(camera: GamingCanvasGridCamera, report: GamingCanvasReport): void {
		if (report.orientation === GamingCanvasOrientation.LANDSCAPE || report.orientationCanvasRotated === true) {
			this.cellSizePx = Math.max(1, (report.canvasWidth / this.gridSideLength) * GamingCanvasUtilScale(camera.z, 1, 100, 0.25, 2));
		} else {
			this.cellSizePx = Math.max(1, (report.canvasHeight / this.gridSideLength) * GamingCanvasUtilScale(camera.z, 1, 100, 0.25, 2));
		}
		this.height = report.canvasHeight / this.cellSizePx;
		this.heightPx = report.canvasHeight;
		this.width = report.canvasWidth / this.cellSizePx;
		this.widthPx = report.canvasWidth;
	}

	public decode(data: Float32Array): GamingCanvasGridViewport {
		this.cameraZScaleMax = data[0];
		this.gridSideLength = data[1] | 0;
		this.cellSizePx = data[2];
		this.height = data[3];
		this.heightPx = data[4] | 0;
		this.heightStart = data[5];
		this.heightStartPx = data[6];
		this.heightStop = data[7];
		this.heightStopPx = data[8];
		this.width = data[9];
		this.widthPx = data[10];
		this.widthStart = data[11];
		this.widthStartPx = data[12];
		this.widthStop = data[13];
		this.widthStopPx = data[14];

		return this;
	}

	public encode(): Float32Array {
		return Float32Array.from([
			this.cameraZScaleMax,
			this.gridSideLength,
			this.cellSizePx,
			this.height,
			this.heightPx,
			this.heightStart,
			this.heightStartPx,
			this.heightStop,
			this.heightStopPx,
			this.width,
			this.widthPx,
			this.widthStart,
			this.widthStartPx,
			this.widthStop,
			this.widthStopPx,
		]);
	}

	public static from(data: Float32Array): GamingCanvasGridViewport {
		return new GamingCanvasGridViewport(0, 0).decode(data);
	}

	public updateConfig(
		camera: GamingCanvasGridCamera,
		cameraFitToView: boolean,
		cameraZScaleMax: number,
		report: GamingCanvasReport,
		sideLength: number,
	): void {
		this.cameraZScaleMax = cameraZScaleMax;
		this.gridSideLength = sideLength;

		this.applyZ(camera, report);
		this.apply(camera, cameraFitToView);
	}
}
