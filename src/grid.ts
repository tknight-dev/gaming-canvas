import { GamingCanvasInputPosition } from './inputs.js';
import { GamingCanvasOrientation, GamingCanvasReport } from './models.js';

/**
 * All (x,y) cooridnates are in terms of cells/tiles unless noted otherwise via the postfix 'px' (pixels)
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

	public set(x: number, y: number, value: number): boolean {
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

	public clone(): GamingCanvasGridUint8Array {
		return GamingCanvasGridUint8Array.from(this.data, true);
	}

	constructor(sideLength: number, fill?: number) {
		super(new Uint8Array(sideLength * sideLength), 'GamingCanvasGridUint8Array', sideLength);
		fill !== undefined && this.data.fill(fill);
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

	public clone(): GamingCanvasGridUint8ClampedArray {
		return GamingCanvasGridUint8ClampedArray.from(this.data, true);
	}

	public constructor(sideLength: number, fill?: number) {
		super(new Uint8ClampedArray(sideLength * sideLength), 'GamingCanvasGridUint8ClampedArray', sideLength);
		fill !== undefined && this.data.fill(fill);
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
	public apply(data: Uint16Array): void {
		const _data = this.data,
			length: number = Math.min(_data.length, data.length);

		for (let i = 0; i < length; i++) {
			_data[i] = data[i];
		}
	}

	public clone(): GamingCanvasGridUint16Array {
		return GamingCanvasGridUint16Array.from(this.data, true);
	}

	public constructor(sideLength: number, fill?: number) {
		super(new Uint16Array(sideLength * sideLength), 'GamingCanvasGridUint16Array', sideLength);
		fill !== undefined && this.data.fill(fill);
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

	public clone(): GamingCanvasGridUint32Array {
		return GamingCanvasGridUint32Array.from(this.data, true);
	}

	public constructor(sideLength: number, fill?: number) {
		super(new Uint32Array(sideLength * sideLength), 'GamingCanvasGridUint32Array', sideLength);
		fill !== undefined && this.data.fill(fill);
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

	public static decodeMultiple(cameras: GamingCanvasGridCamera[], data: Float32Array): GamingCanvasGridCamera[] {
		let camera: GamingCanvasGridCamera,
			length: number = Math.min(cameras.length, (data.length / 4) | 0);

		for (let i = 0, j = 0; i < length; i++, j += 4) {
			camera = cameras[i];

			camera.r = data[j];
			camera.x = data[j + 1];
			camera.y = data[j + 2];
			camera.z = data[j + 3];
		}

		return cameras;
	}

	public encode(): Float32Array {
		return Float32Array.from([this.r, this.x, this.y, this.z]);
	}

	public static encodeMultiple(cameras: GamingCanvasGridCamera[]): Float32Array {
		let camera: GamingCanvasGridCamera,
			data: Float32Array = new Float32Array(cameras.length * 4);

		for (let i = 0, j = 0; i < cameras.length; i++, j += 4) {
			camera = cameras[i];

			data[j] = camera.r;
			data[j + 1] = camera.x;
			data[j + 2] = camera.y;
			data[j + 3] = camera.z;
		}

		return data;
	}

	/**
	 * Create a new instance from an encoded GridCamera
	 */
	public static from(data: Float32Array): GamingCanvasGridCamera {
		return new GamingCanvasGridCamera().decode(data);
	}

	/**
	 * Create a new instances from encoded GridCameras
	 */
	public static fromMultiple(data: Float32Array): GamingCanvasGridCamera[] {
		const cameras: GamingCanvasGridCamera[] = new Array((data.length / 4) | 0);

		for (let i = 0, j = 0; i < cameras.length; i++, j += 4) {
			cameras[i] = new GamingCanvasGridCamera(data[j], data[j + 1], data[j + 2], data[j + 3]);
		}

		return cameras;
	}
}

/**
 * Viewport is a reduced view of the overall data grid. Use this when moving the camera or zooming in and out.
 */
export class GamingCanvasGridViewport {
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

	public constructor(sideLength: number) {
		this.gridSideLength = sideLength;
	}

	/**
	 * @param cameraFitToView if true, modifies the camera object as required to fit the Viewport within the Grid
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

	/**
	 * Will round camera.z down to 4 points of precision (EG: 0.12345678... => 0.1234) to fix issues JavaScript issue with 1.0000000001 instead of 1
	 *
	 * cellSizePx minimum is 1 as subpixel sizes are not supported by JavaScript
	 */
	public applyZ(camera: GamingCanvasGridCamera, report: GamingCanvasReport): void {
		camera.z = ((camera.z * 10000) | 0) / 10000;

		if (report.orientation === GamingCanvasOrientation.LANDSCAPE || report.orientationCanvasRotated === true) {
			this.cellSizePx = Math.max(1, (report.canvasWidth / this.gridSideLength) * camera.z);
		} else {
			this.cellSizePx = Math.max(1, (report.canvasHeight / this.gridSideLength) * camera.z);
		}
		this.height = report.canvasHeight / this.cellSizePx;
		this.heightPx = report.canvasHeight;
		this.width = report.canvasWidth / this.cellSizePx;
		this.widthPx = report.canvasWidth;
	}

	public decode(data: Float32Array): GamingCanvasGridViewport {
		this.gridSideLength = data[0] | 0;
		this.cellSizePx = data[1];
		this.height = data[2];
		this.heightPx = data[3] | 0;
		this.heightStart = data[4];
		this.heightStartPx = data[5];
		this.heightStop = data[6];
		this.heightStopPx = data[7];
		this.width = data[8];
		this.widthPx = data[9];
		this.widthStart = data[10];
		this.widthStartPx = data[11];
		this.widthStop = data[12];
		this.widthStopPx = data[13];

		return this;
	}

	public encode(): Float32Array {
		return Float32Array.from([
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
		return new GamingCanvasGridViewport(0).decode(data);
	}

	public updateConfig(camera: GamingCanvasGridCamera, cameraFitToView: boolean, report: GamingCanvasReport, sideLength: number): void {
		this.gridSideLength = sideLength;

		this.applyZ(camera, report);
		this.apply(camera, cameraFitToView);
	}
}

/**
 * Get the top left of the active grid cell (input overlay position in cell) in px (pixels)
 *
 * @return [left, top]
 */
export const GamingCanvasGridInputOverlaySnapPxTopLeft = (position: GamingCanvasInputPosition, viewport: GamingCanvasGridViewport): number[] => {
	return [
		(position.xRelative * viewport.width - ((position.xRelative * viewport.width + viewport.widthStart) % 1)) * viewport.cellSizePx,
		(position.yRelative * viewport.height - ((position.yRelative * viewport.height + viewport.heightStart) % 1)) * viewport.cellSizePx,
	];
};
