/**
 * @author tknight-dev
 */

interface GamingCanvasFIFOQueueNode<T> {
	data: T;
	next?: GamingCanvasFIFOQueueNode<T>;
}

export class GamingCanvasFIFOQueue<T> {
	private end?: GamingCanvasFIFOQueueNode<T>;
	private start?: GamingCanvasFIFOQueueNode<T>;
	private _length: number = 0;
	private limit: number = -1;
	private overflow: boolean;

	/**
	 * Remove all nodes
	 */
	public clear(): void {
		this.end = undefined;
		this._length = 0;
		this.start = undefined;
	}

	public getEnd(): T | undefined {
		return this.end !== undefined ? this.end.data : undefined;
	}

	public getStart(): T | undefined {
		return this.start !== undefined ? this.start.data : undefined;
	}

	/**
	 * Removes and returns the first queue item
	 */
	public pop(): T | undefined {
		let start: GamingCanvasFIFOQueueNode<T> | undefined = this.start;

		if (start) {
			if (this._length === 1) {
				this.end = undefined;
				this.start = undefined;
			} else {
				this.start = start.next;
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
			if (!this.overflow) {
				// Only use a one-time alarm
				console.error(`GamingCanvas > GamingCanvasFIFOQueue: input overflow [limit=${this.limit}]`);
				this.overflow = true;
			}
		} else {
			let node: GamingCanvasFIFOQueueNode<T> = {
				data: data,
				next: undefined,
			};

			if (this.end) {
				this.end.next = node;
				this.end = node;
			} else {
				this.end = node;
				this.start = node;
			}

			// Reset overflow one-time alarm
			if (this.overflow) {
				this.overflow = false;
			}

			this._length++;
		}
	}

	public toArray(): T[] {
		let array: T[] = new Array(this._length),
			i: number = 0,
			node: GamingCanvasFIFOQueueNode<T> | undefined = this.start;

		while (node) {
			array[i++] = node.data;
			node = node.next;
		}

		return array;
	}

	public get length(): number {
		return this._length;
	}

	public forEach(callback: (value: T) => void): void {
		let node: GamingCanvasFIFOQueueNode<T> | undefined = this.start;
		while (node) {
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
