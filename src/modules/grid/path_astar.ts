import { GamingCanvasUtilArrayExpand } from '../../main/util.js';
import { GamingCanvasGridType } from './grid.js';

/**
 * This is a modified "javascript-astar" library originally developed by Brian Grinstead
 *
 * @author tknight-dev
 */

// date: 9/26/2025
// https://github.com/bgrins/javascript-astar/blob/master/LICENSE
/*
Copyright (c) Brian Grinstead, http://briangrinstead.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

class GamingCanvasGridBinaryHeap {
	private content: GamingCanvasGridPathAStarNode[] = [];

	public bubbleUp(index: number) {
		let child1: GamingCanvasGridPathAStarNode,
			child1Index: number,
			child1WeightCombined: number,
			child2Index: number,
			length: number = this.content.length,
			node: GamingCanvasGridPathAStarNode = this.content[index],
			nodeCombined: number = node.weightCombined,
			swap: number | null;

		while (true) {
			child2Index = (index + 1) << 1;
			child1Index = child2Index - 1;
			swap = null;

			if (child1Index < length) {
				child1 = this.content[child1Index];
				child1WeightCombined = child1.weightCombined;

				if (child1WeightCombined < nodeCombined) {
					swap = child1Index;
				}
			}

			if (child2Index < length) {
				if (this.content[child2Index].weightCombined < (swap === null ? nodeCombined : child1WeightCombined)) {
					swap = child2Index;
				}
			}

			if (swap !== null) {
				this.content[index] = this.content[swap];
				this.content[swap] = node;
				index = swap;
			} else {
				break;
			}
		}
	}

	public get length() {
		return this.content.length;
	}

	public pop() {
		const nodeFirst: GamingCanvasGridPathAStarNode = this.content[0],
			nodeLast: GamingCanvasGridPathAStarNode = this.content.pop();

		if (this.content.length !== 0) {
			this.content[0] = nodeLast;
			this.bubbleUp(0);
		}

		return nodeFirst;
	}

	public push(node: GamingCanvasGridPathAStarNode) {
		this.content.push(node);
		this.sinkDown(this.content.length - 1);
	}

	public remove(node: GamingCanvasGridPathAStarNode) {
		const nodeIndex = this.content.indexOf(node),
			nodeLast: GamingCanvasGridPathAStarNode = this.content.pop();

		if (nodeIndex !== this.content.length - 1) {
			this.content[nodeIndex] = nodeLast;

			if (nodeLast.weightCombined < node.weightCombined) {
				this.sinkDown(nodeIndex);
			} else {
				this.bubbleUp(nodeIndex);
			}
		}
	}

	public rescore(node: GamingCanvasGridPathAStarNode) {
		this.sinkDown(this.content.indexOf(node));
	}

	public sinkDown(index: number) {
		let node: GamingCanvasGridPathAStarNode = this.content[index],
			nodeParent: GamingCanvasGridPathAStarNode,
			nodeParentIndex: number,
			nodeWeightCombined: number = node.weightCombined;

		while (index !== 0) {
			nodeParentIndex = ((index + 1) >> 1) - 1;
			nodeParent = this.content[nodeParentIndex];

			if (nodeWeightCombined < nodeParent.weightCombined) {
				this.content[nodeParentIndex] = node;
				this.content[index] = nodeParent;
				index = nodeParentIndex;
			} else {
				break;
			}
		}
	}
}

interface GamingCanvasGridPathAStarNode {
	closed: boolean;
	gridIndex: number;
	parent?: GamingCanvasGridPathAStarNode;
	visited: boolean;
	weightCombined: number;
	weightGrid: number;
	weightHeuristic: number;
}

export interface GamingCanvasGridPathAStarMemory {
	nodes: GamingCanvasGridPathAStarNode[];
}

const GamingCanvasGridPathAStarOperations: number[][] = [
	[1, 0], // E
	[0, -1], // N
	[0, 1], // S
	[-1, 0], // W
];

const GamingCanvasGridPathAStarOperationsDiagonalsFirst: number[][] = [
	[1, -1], // NE
	[-1, -1], // NW
	[1, 1], // SE
	[-1, 1], // SW
	[1, 0], // E
	[0, -1], // N
	[0, 1], // S
	[-1, 0], // W
];
const GamingCanvasGridPathAStarOperationsDiagonalsLast: number[][] = [
	[1, 0], // E
	[0, -1], // N
	[0, 1], // S
	[-1, 0], // W
	[1, -1], // NE
	[-1, -1], // NW
	[1, 1], // SE
	[-1, 1], // SW
];

export interface GamingCanvasGridPathAStarOptions {
	memory?: GamingCanvasGridPathAStarMemory;
	pathClosest?: boolean;
	pathDiagonalsDisable?: boolean;
	pathHeuristic?: GamingCanvasGridPathAStarOptionsPathHeuristic;
}

export enum GamingCanvasGridPathAStarOptionsPathHeuristic {
	CHEBYSHEV, // Best with diagonals
	DIAGONAL,
	EUCLIDIAN, // Good overall
	MANHATTAN, // Best without diagonals
	NONE,
}

export interface GamingCanvasGridPathAStarResult {
	error?: boolean;
	memory?: GamingCanvasGridPathAStarMemory;
	path: null | number[];
}

/**
 * @param gridIndexA is source cell
 * @param gridIndexB is destination cell
 * @param blocking is either a mask where non-zero results are true, or a function which returns true on blocked
 * @param weight 0 is apply heuristic, and non-zero returns are the final weight (no additional heuristic applied)
 */
export const GamingCanvasGridPathAStar = (
	gridIndexA: number,
	gridIndexB: number,
	grid: GamingCanvasGridType,
	blocking: number | ((cell: number) => boolean),
	weight?: (cell: number, heuristic: () => number) => number,
	options: GamingCanvasGridPathAStarOptions = {},
): GamingCanvasGridPathAStarResult => {
	let a: number,
		b: number,
		gridData: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array = grid.data,
		gridIndexNeighbor: number,
		gridIndexNeighborX: number,
		gridIndexNeighborY: number,
		gridSideLength: number = grid.sideLength,
		gridSize: number = gridSideLength * gridSideLength,
		gridIndexAY: number = gridIndexA % gridSideLength,
		gridIndexAX: number = (gridIndexA - gridIndexAY) / gridSideLength,
		gridIndexBY: number = gridIndexB % gridSideLength,
		gridIndexBX: number = (gridIndexB - gridIndexBY) / gridSideLength,
		heap: GamingCanvasGridBinaryHeap,
		heuristic = (heuristic?: GamingCanvasGridPathAStarOptionsPathHeuristic) => {
			switch (heuristic !== undefined ? heuristic : optionPathHeuristic) {
				case GamingCanvasGridPathAStarOptionsPathHeuristic.CHEBYSHEV:
					return Math.max(Math.abs(gridIndexNeighborX - gridIndexBX), Math.abs(gridIndexNeighborY - gridIndexBY));
				case GamingCanvasGridPathAStarOptionsPathHeuristic.DIAGONAL:
					a = Math.abs(gridIndexNeighborX - gridIndexBX);
					b = Math.abs(gridIndexNeighborY - gridIndexBY);
					return a + b + -0.5858 * Math.min(a, b);
				case GamingCanvasGridPathAStarOptionsPathHeuristic.EUCLIDIAN:
					return ((gridIndexNeighborX - gridIndexBX) ** 2 + (gridIndexNeighborY - gridIndexBY) ** 2) ** 0.5;
				case GamingCanvasGridPathAStarOptionsPathHeuristic.MANHATTAN:
					return Math.abs(gridIndexNeighborX - gridIndexBX) + Math.abs(gridIndexNeighborY - gridIndexBY);
				case GamingCanvasGridPathAStarOptionsPathHeuristic.NONE:
					return 1;
			}
		},
		node: GamingCanvasGridPathAStarNode,
		nodeClosest: GamingCanvasGridPathAStarNode,
		nodeNeighbor: GamingCanvasGridPathAStarNode,
		nodes: GamingCanvasGridPathAStarNode[],
		listClosedInstance: GamingCanvasGridPathAStarNode,
		memory: GamingCanvasGridPathAStarMemory | undefined = options.memory,
		optionBlockingMask: boolean = typeof blocking === 'number',
		optionPathClosest: boolean = options.pathClosest === true,
		optionPathDiagonals: boolean = !(options.pathDiagonalsDisable === true),
		optionPathHeuristic: GamingCanvasGridPathAStarOptionsPathHeuristic,
		path: number[],
		pathOperations: number[][],
		pathOperationsInstance: number[],
		visited: boolean,
		weightGridNext: number,
		x: number,
		y: number;

	/*
	 * Validation
	 */
	if (gridIndexA === gridIndexB) {
		return {
			memory: memory,
			path: [],
		};
	} else if (gridIndexA < 0 || gridIndexB < 0 || gridIndexA > gridSize || gridIndexB > gridSize) {
		console.error('GamingCanvasGridPathAStar: invalid initial gridIndex(s)');
		return {
			error: true,
			memory: memory,
			path: null,
		};
	} else if (optionBlockingMask === true) {
		if ((gridData[gridIndexA] & (<number>blocking)) !== 0 || (gridData[gridIndexB] & (<number>blocking)) !== 0) {
			console.error('GamingCanvasGridPathAStar: invalid initial gridIndex(s) [A or B blocked]');
			return {
				error: true,
				memory: memory,
				path: null,
			};
		}
	} else {
		if ((<any>blocking)(gridData[gridIndexA]) === true || (<any>blocking)(gridData[gridIndexB]) === true) {
			console.error('GamingCanvasGridPathAStar: invalid initial gridIndex(s) [A or B blocked]');
			return {
				error: true,
				memory: memory,
				path: null,
			};
		}
	}

	/*
	 * Configuration
	 */
	heap = new GamingCanvasGridBinaryHeap();

	// Memory
	if (memory !== undefined) {
		nodes = options.memory.nodes;

		// Defaults
		for (x = 0; x < nodes.length; x++) {
			listClosedInstance = nodes[x];

			listClosedInstance.closed = false;
			listClosedInstance.gridIndex = x;
			listClosedInstance.parent = undefined;
			listClosedInstance.visited = false;
			listClosedInstance.weightCombined = 0;
			listClosedInstance.weightGrid = 0;
			listClosedInstance.weightHeuristic = 0;
		}

		if (nodes.length < gridSize) {
			x = nodes.length;
			y = gridSize - nodes.length;

			GamingCanvasUtilArrayExpand(nodes, y);

			// Defaults
			y += x;
			for (; x < y; x++) {
				nodes[x] = {
					closed: false,
					gridIndex: x,
					parent: undefined,
					visited: false,
					weightCombined: 0,
					weightGrid: 0,
					weightHeuristic: 0,
				};
			}
		}
	} else {
		nodes = new Array(gridSize);

		// Defaults
		for (x = 0; x < gridSize; x++) {
			nodes[x] = {
				closed: false,
				gridIndex: x,
				parent: undefined,
				visited: false,
				weightCombined: 0,
				weightGrid: 0,
				weightHeuristic: 0,
			};
		}

		memory = {
			nodes: nodes,
		};
	}

	// Path: heuristic
	if (options !== undefined && options.pathHeuristic !== undefined) {
		optionPathHeuristic = options.pathHeuristic;
	} else {
		if (optionPathDiagonals === true) {
			optionPathHeuristic = GamingCanvasGridPathAStarOptionsPathHeuristic.CHEBYSHEV;
		} else {
			optionPathHeuristic = GamingCanvasGridPathAStarOptionsPathHeuristic.MANHATTAN;
		}
	}

	// Initial node heuristic value
	node = nodes[gridIndexA];

	switch (optionPathHeuristic) {
		case GamingCanvasGridPathAStarOptionsPathHeuristic.CHEBYSHEV:
			node.weightHeuristic = Math.max(Math.abs(gridIndexAX - gridIndexBX), Math.abs(gridIndexAY - gridIndexBY));

			// Order prefers straighter lines
			pathOperations = optionPathDiagonals === true ? GamingCanvasGridPathAStarOperationsDiagonalsLast : GamingCanvasGridPathAStarOperations;
			break;
		case GamingCanvasGridPathAStarOptionsPathHeuristic.DIAGONAL:
			a = Math.abs(gridIndexAX - gridIndexBX);
			b = Math.abs(gridIndexAY - gridIndexBY);
			node.weightHeuristic = a + b + -0.5858 * Math.min(a, b);

			// Order doesn't matter
			pathOperations = optionPathDiagonals === true ? GamingCanvasGridPathAStarOperationsDiagonalsLast : GamingCanvasGridPathAStarOperations;
			break;
		case GamingCanvasGridPathAStarOptionsPathHeuristic.EUCLIDIAN:
			node.weightHeuristic = ((gridIndexAX - gridIndexBX) ** 2 + (gridIndexAY - gridIndexBY) ** 2) ** 0.5;

			// Order doesn't matter
			pathOperations = optionPathDiagonals === true ? GamingCanvasGridPathAStarOperationsDiagonalsLast : GamingCanvasGridPathAStarOperations;
			break;
		case GamingCanvasGridPathAStarOptionsPathHeuristic.MANHATTAN:
			node.weightHeuristic = Math.abs(gridIndexAX - gridIndexBX) + Math.abs(gridIndexAY - gridIndexBY);

			// Order doesn't matter
			pathOperations = optionPathDiagonals === true ? GamingCanvasGridPathAStarOperationsDiagonalsLast : GamingCanvasGridPathAStarOperations;
			break;
		case GamingCanvasGridPathAStarOptionsPathHeuristic.NONE:
			node.weightHeuristic = 0;

			// Order prefers straighter lines
			pathOperations = optionPathDiagonals === true ? GamingCanvasGridPathAStarOperationsDiagonalsFirst : GamingCanvasGridPathAStarOperations;
			break;
	}

	heap.push(node);
	nodeClosest = node;

	while (heap.length !== 0) {
		node = heap.pop();

		// Reached destination
		if (node.gridIndex === gridIndexB) {
			path = [];

			while (node.parent !== undefined) {
				path.push(node.gridIndex);
				node = node.parent;
			}

			return {
				memory: memory,
				path: path,
			};
		}

		node.closed = true;
		y = node.gridIndex % gridSideLength;
		x = (node.gridIndex - y) / gridSideLength;

		// Iterate through directional operations
		for (pathOperationsInstance of pathOperations) {
			gridIndexNeighborX = x + pathOperationsInstance[0];
			gridIndexNeighborY = y + pathOperationsInstance[1];

			// Is valid?
			if (gridIndexNeighborX === -1 || gridIndexNeighborY === -1 || gridIndexNeighborX === gridSideLength || gridIndexNeighborY === gridSideLength) {
				continue;
			}
			gridIndexNeighbor = gridIndexNeighborX * gridSideLength + gridIndexNeighborY;
			nodeNeighbor = nodes[gridIndexNeighbor];

			// Already checked or blocked
			if (nodeNeighbor.closed) {
				continue;
			} else if (optionBlockingMask === true) {
				if ((gridData[gridIndexNeighbor] & (<number>blocking)) !== 0) {
					continue;
				}
			} else {
				if ((<any>blocking)(gridData[gridIndexNeighbor]) === true) {
					continue;
				}
			}

			if (pathOperationsInstance[0] !== 0 && pathOperationsInstance[1] !== 0) {
				weightGridNext =
					node.weightGrid + nodeNeighbor.weightGrid * 1.41421 + (weight !== undefined ? weight(gridData[nodeNeighbor.gridIndex], heuristic) : 0);
			} else {
				weightGridNext = node.weightGrid + nodeNeighbor.weightGrid + (weight !== undefined ? weight(gridData[nodeNeighbor.gridIndex], heuristic) : 0);
			}
			visited = nodeNeighbor.visited;

			if (visited !== true || weightGridNext < nodeNeighbor.weightGrid) {
				nodeNeighbor.parent = node;
				nodeNeighbor.visited = true;
				nodeNeighbor.weightGrid = weightGridNext;

				if (nodeNeighbor.weightHeuristic === 0) {
					switch (optionPathHeuristic) {
						case GamingCanvasGridPathAStarOptionsPathHeuristic.CHEBYSHEV:
							nodeNeighbor.weightHeuristic = Math.max(Math.abs(gridIndexNeighborX - gridIndexBX), Math.abs(gridIndexNeighborY - gridIndexBY));
							break;
						case GamingCanvasGridPathAStarOptionsPathHeuristic.DIAGONAL:
							a = Math.abs(gridIndexNeighborX - gridIndexBX);
							b = Math.abs(gridIndexNeighborY - gridIndexBY);
							nodeNeighbor.weightHeuristic = a + b + -0.5858 * Math.min(a, b);
							break;
						case GamingCanvasGridPathAStarOptionsPathHeuristic.EUCLIDIAN:
							nodeNeighbor.weightHeuristic = ((gridIndexNeighborX - gridIndexBX) ** 2 + (gridIndexNeighborY - gridIndexBY) ** 2) ** 0.5;
							break;
						case GamingCanvasGridPathAStarOptionsPathHeuristic.MANHATTAN:
							nodeNeighbor.weightHeuristic = Math.abs(gridIndexNeighborX - gridIndexBX) + Math.abs(gridIndexNeighborY - gridIndexBY);
							break;
						case GamingCanvasGridPathAStarOptionsPathHeuristic.NONE:
							nodeNeighbor.weightHeuristic = 1;
							break;
					}
				}

				nodeNeighbor.weightCombined = nodeNeighbor.weightGrid + nodeNeighbor.weightHeuristic;

				if (optionPathClosest === true) {
					if (
						nodeNeighbor.weightHeuristic < nodeClosest.weightHeuristic ||
						(nodeNeighbor.weightHeuristic === nodeClosest.weightHeuristic && nodeNeighbor.weightGrid < nodeClosest.weightGrid)
					) {
						nodeClosest = nodeNeighbor;
					}
				}

				if (visited !== true) {
					heap.push(nodeNeighbor);
				} else {
					heap.rescore(nodeNeighbor);
				}
			}
		}
	}

	if (optionPathClosest === true) {
		path = [];

		while (nodeClosest.parent !== undefined) {
			path.push(nodeClosest.gridIndex);
			nodeClosest = nodeClosest.parent;
		}

		return {
			memory: memory,
			path: path,
		};
	}

	return {
		memory: memory,
		path: null,
	};
};
