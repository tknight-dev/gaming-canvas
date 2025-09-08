/**
 * All (x,y) cooridnates are in terms of cells/tiles unless noted otherwise via the postfix 'px' (pixels)
 *
 * All grids are square
 *
 * @author tknight-dev
 */

export interface GamingCanvasGridICamera {
	r: number; // float: rotation in radians
	x: number; // float
	y: number; // float
	z: number; // float: zoom
}

export class GamingCanvasGridCamera implements GamingCanvasGridICamera {
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

	public decode(data: Float64Array): GamingCanvasGridCamera {
		this.r = data[0];
		this.x = data[1];
		this.y = data[2];
		this.z = data[3];

		return this;
	}

	public static decodeMultiple(cameras: GamingCanvasGridICamera[], data: Float64Array): GamingCanvasGridICamera[] {
		let camera: GamingCanvasGridICamera,
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

	public encode(): Float64Array {
		return Float64Array.from([this.r, this.x, this.y, this.z]);
	}

	public static encodeSingle(camera: GamingCanvasGridICamera): Float64Array {
		return Float64Array.from([camera.r, camera.x, camera.y, camera.z]);
	}

	public static encodeMultiple(cameras: GamingCanvasGridICamera[]): Float64Array {
		let camera: GamingCanvasGridICamera,
			data: Float64Array = new Float64Array(cameras.length * 4);

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
	public static from(data: Float64Array | GamingCanvasGridICamera): GamingCanvasGridCamera {
		if (data instanceof Float64Array) {
			return new GamingCanvasGridCamera().decode(data);
		} else {
			return new GamingCanvasGridCamera(data.r, data.x, data.y, data.z);
		}
	}

	/**
	 * Create a new instances from encoded GridCameras
	 */
	public static fromMultiple(data: Float64Array): GamingCanvasGridCamera[] {
		const cameras: GamingCanvasGridCamera[] = new Array((data.length / 4) | 0);

		for (let i = 0, j = 0; i < cameras.length; i++, j += 4) {
			cameras[i] = new GamingCanvasGridCamera(data[j], data[j + 1], data[j + 2], data[j + 3]);
		}

		return cameras;
	}
}
