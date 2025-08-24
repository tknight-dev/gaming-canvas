/**
 * @author tknight-dev
 */

export interface GamingCanvasDoubleLinkedListNode<T> {
	data: T;
	next: GamingCanvasDoubleLinkedListNode<T> | undefined;
	previous: GamingCanvasDoubleLinkedListNode<T> | undefined;
}

export class GamingCanvasDoubleLinkedList<T> {
	private end: GamingCanvasDoubleLinkedListNode<T> | undefined = undefined;
	private start: GamingCanvasDoubleLinkedListNode<T> | undefined = undefined;
	private _length: number = 0;

	public GamingCanvasDoubleLinkedList(array?: T[]) {
		if (array !== undefined && Array.isArray(array)) {
			let data: T, node: GamingCanvasDoubleLinkedListNode<T>;

			for (data of array) {
				node = {
					data: data,
					next: undefined,
					previous: this._length ? this.end : undefined,
				};

				if (this.end) {
					this.end.next = node;
					this.end = node;
				} else {
					this.end = node;
					this.start = node;
				}

				this._length++;
			}
		}
	}

	/**
	 * Remove all nodes
	 */
	public clear(): void {
		this.end = undefined;
		this._length = 0;
		this.start = undefined;
	}

	public getEnd(): GamingCanvasDoubleLinkedListNode<T> | undefined {
		return this.end;
	}

	public getStart(): GamingCanvasDoubleLinkedListNode<T> | undefined {
		return this.start;
	}

	public popEnd(): T | undefined {
		let end: GamingCanvasDoubleLinkedListNode<T> | undefined = this.end;

		if (end) {
			if (this._length === 1) {
				this.end = undefined;
				this.start = undefined;
			} else {
				this.end = end.previous;
			}

			this._length--;
			return end.data;
		}

		return undefined;
	}

	public popStart(): T | undefined {
		let start: GamingCanvasDoubleLinkedListNode<T> | undefined = this.start;

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

	public pushEnd(data: T): GamingCanvasDoubleLinkedListNode<T> {
		let node: GamingCanvasDoubleLinkedListNode<T> = {
			data: data,
			next: undefined,
			previous: this._length ? this.end : undefined,
		};

		if (this.end) {
			this.end.next = node;
			this.end = node;
		} else {
			this.end = node;
			this.start = node;
		}

		this._length++;

		return node;
	}

	public pushStart(data: T): GamingCanvasDoubleLinkedListNode<T> {
		let node: GamingCanvasDoubleLinkedListNode<T> = {
			data: data,
			next: this._length ? this.start : undefined,
			previous: undefined,
		};

		if (this.start) {
			this.start.previous = node;
			this.start = node;
		} else {
			this.end = node;
			this.start = node;
		}

		this._length++;

		return node;
	}

	public remove(node: GamingCanvasDoubleLinkedListNode<T>): GamingCanvasDoubleLinkedListNode<T> {
		if (this.end === node) {
			this.end = node.previous;
		}
		if (this.start === node) {
			this.start = node.next;
		}
		if (node.next) {
			node.next.previous = node.previous;
			node.next = undefined;
		}
		if (node.previous) {
			node.previous.next = node.next;
			node.previous = undefined;
		}

		return node;
	}

	public toArray(): T[] {
		let array: T[] = new Array(this._length),
			i: number = 0,
			node: GamingCanvasDoubleLinkedListNode<T> | undefined = this.start;

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
		let node: GamingCanvasDoubleLinkedListNode<T> | undefined = this.start;
		while (node) {
			callback(node.data);
			node = node.next;
		}
	}
}
