import { GamingCanvasGridType } from './grid.js';

/**
 * @author tknight-dev
 */

export const GamingCanvasGridUtilDistance = (gridIndexA: number, gridIndexB: number, grid: GamingCanvasGridType) => {
	const y1: number = gridIndexA % grid.sideLength,
		y2: number = gridIndexB % grid.sideLength,
		x1: number = (gridIndexA - y1) / grid.sideLength,
		x2: number = (gridIndexB - y2) / grid.sideLength;

	return ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5;
};
