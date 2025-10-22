import { GamingCanvasGridType } from './grid.js';

/**
 * @author tknight-dev
 */

export const GamingCanvasGridUtilDistance = (gridIndexA: number, gridIndexB: number, grid: GamingCanvasGridType): number => {
	const y1: number = gridIndexA % grid.sideLength,
		y2: number = gridIndexB % grid.sideLength,
		x1: number = (gridIndexA - y1) / grid.sideLength,
		x2: number = (gridIndexB - y2) / grid.sideLength;

	return ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5;
};

/**
 * Sort array of grid indexes based on their distances to a source grid index
 *
 * @source number is a grid index
 * @gridIndexes number[] of grid indexes
 * @grid GamingCanvasGridType the grid that hosts these grid indexes
 * @invert boolean? option toggle to invert final sort order
 * @return number[] is farthest away from source first and closest to source last
 */
export const GamingCanvasGridUtilDistanceSort = (source: number, gridIndexes: number[], grid: GamingCanvasGridType, invert?: boolean): number[] => {
	let destinationX: number,
		destinationY: number,
		distanceByGridIndex: Map<number, number> = new Map(),
		gridIndex: number,
		sourceY: number = source % grid.sideLength,
		sourceX: number = (source - sourceY) / grid.sideLength;

	for (gridIndex of gridIndexes) {
		destinationY = gridIndex % grid.sideLength;
		destinationX = (gridIndex - destinationY) / grid.sideLength;

		distanceByGridIndex.set(gridIndex, ((destinationX - sourceX) ** 2 + (destinationY - sourceY) ** 2) ** 0.5);
	}

	return gridIndexes.sort((gridIndexA: number, gridIndexB: number) => {
		if (invert === true) {
			return distanceByGridIndex.get(gridIndexB) - distanceByGridIndex.get(gridIndexA);
		} else {
			return distanceByGridIndex.get(gridIndexA) - distanceByGridIndex.get(gridIndexB);
		}
	});
};
