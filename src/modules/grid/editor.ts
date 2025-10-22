import { GamingCanvasDoubleLinkedList, GamingCanvasDoubleLinkedListNode } from '../../main/double-linked-list.js';
import { GamingCanvasGridType } from './grid.js';

/**
 * @author tknight-dev
 */

interface GamingCanvasGridEditHistoryEvent {
	gridIndex: number;
	type: GamingCanvasGridEditType;
	values: Map<number, number>;
	valuesOriginal: Map<number, number>;
}

export enum GamingCanvasGridEditType {
	FILL_APPLY,
	FILL_ERASE,
	SINGLE_APPLY,
	SINGLE_ERASE,
}

export class GamingCanvasGridEditor {
	private empty: boolean;
	private grid: GamingCanvasGridType;
	private history: GamingCanvasDoubleLinkedList<GamingCanvasGridEditHistoryEvent>;
	private historyEventCurrent: GamingCanvasDoubleLinkedListNode<GamingCanvasGridEditHistoryEvent> | undefined;
	private historyLimit: number;

	/**
	 * @param grid pass in a reference to the grid that this editor instance will be assigned to
	 * @param historyLimit limit how many edit instances are remembered (replace oldest entry if full)
	 */
	constructor(grid: GamingCanvasGridType, historyLimit: number = 50) {
		this.empty = true;
		this.grid = grid;
		this.history = new GamingCanvasDoubleLinkedList();
		this.historyLimit = historyLimit;
	}

	/**
	 * Replace single cell and all neighboring cells that match the original cell's value (no diagonals)
	 */
	public fillApply(
		gridIndex: number,
		value: number,
		historySkip: boolean = false,
		historyType: GamingCanvasGridEditType = GamingCanvasGridEditType.FILL_APPLY,
	): void {
		if (this.grid.data[gridIndex] !== value) {
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
							valuesOriginal.set(gridIndex, gridData[gridIndex]);
							gridData[gridIndex] = value;
							modified.add(gridIndex);
							values.set(gridIndex, value);

							// Down
							for (b = y + 1; b !== sideLength; b++) {
								gridIndex = a * sideLength + b;

								if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
									break;
								}
								valuesOriginal.set(gridIndex, gridData[gridIndex]);
								gridData[gridIndex] = value;
								modified.add(gridIndex);
								values.set(gridIndex, value);

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
								valuesOriginal.set(gridIndex, gridData[gridIndex]);
								gridData[gridIndex] = value;
								modified.add(gridIndex);
								values.set(gridIndex, value);

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
							valuesOriginal.set(gridIndex, gridData[gridIndex]);
							gridData[gridIndex] = value;
							modified.add(gridIndex);
							values.set(gridIndex, value);

							// Down
							for (b = y + 1; b !== sideLength; b++) {
								gridIndex = a * sideLength + b;

								if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
									break;
								}
								valuesOriginal.set(gridIndex, gridData[gridIndex]);
								gridData[gridIndex] = value;
								modified.add(gridIndex);
								values.set(gridIndex, value);

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
								valuesOriginal.set(gridIndex, gridData[gridIndex]);
								gridData[gridIndex] = value;
								modified.add(gridIndex);
								values.set(gridIndex, value);

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
				values: Map<number, number> = new Map(),
				valueOriginal: number = gridData[gridIndex],
				valuesOriginal: Map<number, number> = new Map();

			historySkip === false &&
				this.historyAdd({
					gridIndex: gridIndex,
					type: historyType,
					values: values,
					valuesOriginal: valuesOriginal,
				});

			modifier(gridIndex);
		}
	}

	public fillErase(gridIndex: number, historySkip: boolean = false): void {
		this.fillApply(gridIndex, 0, historySkip, GamingCanvasGridEditType.FILL_ERASE);
	}

	private historyAdd(event: GamingCanvasGridEditHistoryEvent): void {
		const history: GamingCanvasDoubleLinkedList<GamingCanvasGridEditHistoryEvent> = this.history;

		// Empty
		if (this.empty === true) {
			history.popStart();
		}

		// New Timeline
		if (history.length !== 0 && this.historyEventCurrent !== history.getEnd()) {
			let node: GamingCanvasDoubleLinkedListNode<GamingCanvasGridEditHistoryEvent>;

			// Remove events from a previous timeline
			// EG edit1, edit2, edit3a, edit4, undo (now edit3a), undo (now edit2), edit3b (edit4 no longer exists)
			node = this.historyEventCurrent.next;
			while (node !== undefined) {
				history.remove(node);
				node = node.next;
			}
		}

		// Size Limit
		if (history.length === this.historyLimit) {
			history.popStart();
		}

		// Final
		this.empty = false;
		history.pushEnd(event);
		this.historyEventCurrent = history.getEnd();
	}

	public historyClear(): void {
		this.empty = true;
		this.history.clear();
		this.historyEventCurrent = undefined;
	}

	public historyRedo(): boolean {
		if (this.history.length !== 0 && this.historyEventCurrent.next !== undefined) {
			// Update timeline
			if (this.empty !== true) {
				this.historyEventCurrent = this.historyEventCurrent.next;
			}
			this.empty = false;

			// Re-apply
			let event: GamingCanvasGridEditHistoryEvent = this.historyEventCurrent.data,
				gridData: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array = this.grid.data,
				gridIndex: number,
				value: number;
			for ([gridIndex, value] of event.values.entries()) {
				gridData[gridIndex] = value;
			}

			return true;
		}

		return false;
	}

	public historyRedoAvailable(): boolean {
		return this.history.length !== 0 && this.historyEventCurrent.next !== undefined;
	}

	public historyUndo(): boolean {
		if (this.history.length !== 0 && this.empty !== true) {
			const event: GamingCanvasGridEditHistoryEvent = this.historyEventCurrent.data,
				gridData: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array = this.grid.data;

			// Reverse apply
			let gridIndex: number, value: number;
			for ([gridIndex, value] of event.valuesOriginal.entries()) {
				gridData[gridIndex] = value;
			}

			// Update timeline
			if (this.historyEventCurrent.previous !== undefined) {
				this.historyEventCurrent = this.historyEventCurrent.previous;
				this.empty = false;
			} else {
				this.empty = true;
			}

			return true;
		}

		return false;
	}

	public historyUndoAvailable(): boolean {
		return this.history.length !== 0 && this.empty !== true;
	}

	public singleApply(
		gridIndex: number,
		value: number,
		historySkip: boolean = false,
		historyType: GamingCanvasGridEditType = GamingCanvasGridEditType.SINGLE_APPLY,
	): void {
		if (this.grid.data[gridIndex] !== value) {
			let values: Map<number, number> = new Map(),
				valuesOriginal: Map<number, number> = new Map();

			values.set(gridIndex, value);
			valuesOriginal.set(gridIndex, this.grid.data[gridIndex]);

			historySkip === false &&
				this.historyAdd({
					gridIndex: gridIndex,
					type: historyType,
					values: values,
					valuesOriginal: valuesOriginal,
				});
			this.grid.data[gridIndex] = value;
		}
	}

	public singleErase(gridIndex: number, historySkip: boolean = false): void {
		this.singleApply(gridIndex, 0, historySkip, GamingCanvasGridEditType.SINGLE_ERASE);
	}
}
