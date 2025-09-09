import { GamingCanvasGridICamera } from './camera.js';
import { GamingCanvasOrientation, GamingCanvasReport } from '../../main/models.js';
import { GamingCanvasInputPosition, GamingCanvasInputPositionBasic } from '../../main/inputs.js';

/**
 * All (x,y) cooridnates are in terms of cells/tiles unless noted otherwise via the postfix 'px' (pixels)
 *
 * All grids are square
 *
 * @author tknight-dev
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
	public apply(camera: GamingCanvasGridICamera, cameraFitToView?: boolean): void {
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
	public applyZ(camera: GamingCanvasGridICamera, report: GamingCanvasReport): void {
		// camera.z = ((camera.z * 10000) | 0) / 10000;

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

	public decode(data: Float64Array): GamingCanvasGridViewport {
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

	public encode(): Float64Array {
		return Float64Array.from([
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

	public static from(data: Float64Array): GamingCanvasGridViewport {
		return new GamingCanvasGridViewport(0).decode(data);
	}

	public updateConfig(camera: GamingCanvasGridICamera, cameraFitToView: boolean, report: GamingCanvasReport, sideLength: number): void {
		this.gridSideLength = sideLength;

		this.applyZ(camera, report);
		this.apply(camera, cameraFitToView);
	}
}

/**
 * Get the top left of the active grid cell (input overlay position in cell) in px (pixels)
 *
 * @position must not be relative to canvas
 * @return [cellSizePx, left, top]
 */
export const GamingCanvasGridInputOverlaySnapPxTopLeft = (
	position: GamingCanvasInputPosition,
	report: GamingCanvasReport,
	viewport: GamingCanvasGridViewport,
): number[] => {
	return [
		viewport.cellSizePx * report.scaler,
		(position.xRelative * viewport.width - ((position.xRelative * viewport.width + viewport.widthStart) % 1)) * viewport.cellSizePx * report.scaler,
		(position.yRelative * viewport.height - ((position.yRelative * viewport.height + viewport.heightStart) % 1)) * viewport.cellSizePx * report.scaler,
	];
};

/**
 * Get Grid cooridnate from the position
 *
 * @position must be relative to canvas
 * @return [x, y]
 */
export const GamingCanvasGridInputToCoordinate = (position: GamingCanvasInputPosition, viewport: GamingCanvasGridViewport): GamingCanvasInputPositionBasic => {
	return {
		x: (position.xRelative * viewport.width + viewport.widthStart) | 0,
		y: (position.yRelative * viewport.height + viewport.heightStart) | 0,
	};
};
