/**
 * @author tknight-dev
 */

interface GamingCanvasFIFOQueueNode<T> {
	data: T;
	next?: GamingCanvasFIFOQueueNode<T>;
}

export class GamingCanvasFIFOQueue<T> {
	private _end?: GamingCanvasFIFOQueueNode<T>;
	private _start?: GamingCanvasFIFOQueueNode<T>;
	private _length: number = 0;
	private limit: number = -1;
	private overflow!: boolean;

	public constructor(array?: T[]) {
		if (array !== undefined && Array.isArray(array)) {
			let data: T, node: GamingCanvasFIFOQueueNode<T>;

			for (data of array) {
				node = {
					data: data,
					next: undefined,
				};

				if (this._end !== undefined) {
					this._end.next = node;
					this._end = node;
				} else {
					this._end = node;
					this._start = node;
				}

				// Reset overflow one-time alarm
				if (this.overflow === true) {
					this.overflow = false;
				}

				this._length++;
			}
		}
	}

	/**
	 * Remove all nodes
	 */
	public clear(): void {
		this._end = undefined;
		this._length = 0;
		this._start = undefined;
	}

	/**
	 * Removes and returns the first queue item
	 */
	public pop(): T | undefined {
		let start: GamingCanvasFIFOQueueNode<T> | undefined = this._start;

		if (start !== undefined) {
			if (this._length === 1) {
				this._end = undefined;
				this._start = undefined;
			} else {
				this._start = start.next;
			}

			this._length--;
			return start.data;
		}

		return undefined;
	}

	/**
	 * Adds to the end of the queue
	 */
	public push(data: T): void {
		if (this.limit !== -1 && this._length >= this.limit) {
			if (this.overflow !== true) {
				// Only use a one-time alarm
				console.error(`GamingCanvas > GamingCanvasFIFOQueue: input overflow [limit=${this.limit}]`);
				this.overflow = true;
			}
		} else {
			let node: GamingCanvasFIFOQueueNode<T> = {
				data: data,
				next: undefined,
			};

			if (this._end !== undefined) {
				this._end.next = node;
				this._end = node;
			} else {
				this._end = node;
				this._start = node;
			}

			// Reset overflow one-time alarm
			if (this.overflow === true) {
				this.overflow = false;
			}

			this._length++;
		}
	}

	public toArray(): T[] {
		let array: T[] = new Array(this._length),
			i: number = 0,
			node: GamingCanvasFIFOQueueNode<T> | undefined = this._start;

		while (node !== undefined) {
			array[i++] = node.data;
			node = node.next;
		}

		return array;
	}

	public get end(): GamingCanvasFIFOQueueNode<T> | undefined {
		return this._end;
	}

	public get length(): number {
		return this._length;
	}

	public get start(): GamingCanvasFIFOQueueNode<T> | undefined {
		return this._start;
	}

	public forEach(callback: (value: T) => void): void {
		let node: GamingCanvasFIFOQueueNode<T> | undefined = this._start;

		while (node !== undefined) {
			callback(node.data);
			node = node.next;
		}
	}

	/**
	 * @param limit 0 or null is unlimited
	 */
	public setLimit(limit: number | null) {
		this.limit = limit || -1;
	}

	public isOverflow(): boolean {
		return this.overflow;
	}
}
