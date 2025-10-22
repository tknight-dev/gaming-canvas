import { GamingCanvasGridType } from './grid.js';

/**
 * @author tknight-dev
 */

export class GamingCanvasGridEditor {
	private grid: GamingCanvasGridType;

	/**
	 * @param grid pass in a reference to the grid that this editor instance will be assigned to
	 */
	constructor(grid: GamingCanvasGridType) {
		this.grid = grid;
	}

	/**
	 * Replace single cell and all neighboring cells that match the original cell's value (no diagonals)
	 */
	public applyFill(gridIndex: number, value: number): void {
		const gridData: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array = this.grid.data,
			modified: Set<number> = new Set(),
			modifier = (gridIndex: number) => {
				let a: number = 0,
					b: number = 0,
					check: number[] = [],
					x: number = (gridIndex / sideLength) | 0,
					y: number = gridIndex % sideLength;

				// Center & Left
				if (x !== 0) {
					for (a = x; a !== 0; a--) {
						gridIndex = a * sideLength + y;

						if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
							break;
						}
						gridData[gridIndex] = value;
						modified.add(gridIndex);

						// Down
						for (b = y + 1; b !== sideLength; b++) {
							gridIndex = a * sideLength + b;

							if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
								break;
							}
							gridData[gridIndex] = value;
							modified.add(gridIndex);

							// Left
							if (a !== 0) {
								gridIndex = (a - 1) * sideLength + b;
								gridData[gridIndex] === valueOriginal && check.push(gridIndex);
							}

							// Right
							if (a !== sideLength) {
								gridIndex = (a + 1) * sideLength + b;
								gridData[gridIndex] === valueOriginal && check.push(gridIndex);
							}
						}

						// Up
						for (b = y - 1; b !== 0; b--) {
							gridIndex = a * sideLength + b;

							if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
								break;
							}
							gridData[gridIndex] = value;
							modified.add(gridIndex);

							// Left
							if (a !== 0) {
								gridIndex = (a - 1) * sideLength + b;
								gridData[gridIndex] === valueOriginal && check.push(gridIndex);
							}

							// Right
							if (a !== sideLength) {
								gridIndex = (a + 1) * sideLength + b;
								gridData[gridIndex] === valueOriginal && check.push(gridIndex);
							}
						}
					}
				}

				// Right
				if (x !== sideLength) {
					for (a = x + 1; a !== sideLength; a++) {
						gridIndex = a * sideLength + y;

						if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
							break;
						}
						gridData[gridIndex] = value;
						modified.add(gridIndex);

						// Down
						for (b = y + 1; b !== sideLength; b++) {
							gridIndex = a * sideLength + b;

							if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
								break;
							}
							gridData[gridIndex] = value;
							modified.add(gridIndex);

							// Left
							if (a !== 0) {
								gridIndex = (a - 1) * sideLength + b;
								gridData[gridIndex] === valueOriginal && check.push(gridIndex);
							}

							// Right
							if (a !== sideLength) {
								gridIndex = (a + 1) * sideLength + b;
								gridData[gridIndex] === valueOriginal && check.push(gridIndex);
							}
						}

						// Up
						for (b = y - 1; b !== 0; b--) {
							gridIndex = a * sideLength + b;

							if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
								break;
							}
							gridData[gridIndex] = value;
							modified.add(gridIndex);

							// Left
							if (a !== 0) {
								gridIndex = (a - 1) * sideLength + b;
								gridData[gridIndex] === valueOriginal && check.push(gridIndex);
							}

							// Right
							if (a !== sideLength) {
								gridIndex = (a + 1) * sideLength + b;
								gridData[gridIndex] === valueOriginal && check.push(gridIndex);
							}
						}
					}
				}

				// Check
				for (gridIndex of check) {
					modified.has(gridIndex) !== true && modifier(gridIndex);
				}
			},
			sideLength: number = this.grid.sideLength,
			valueOriginal: number = gridData[gridIndex];

		modifier(gridIndex);
	}

	/**
	 * Replace single cell
	 */
	public applySingle(gridIndex: number, value: number): void {
		this.grid.data[gridIndex] = value;
	}
}
