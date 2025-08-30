/**
 * Statistical analysis stuff
 *
 * @author tknight-dev
 */

/**
 * Dynamically increase array size without disturbing existing values
 *
 * Will catch browser errors if the increase request is too large, and will scale down the job into smaller segments
 *
 * @param increaseBy defines how much longer the array should be
 */
export const GamingCanvasUtilArrayExpand = (array: any[], increaseBy: number, fill?: any): any[] => {
	if (increaseBy > 0) {
		try {
			// Error thrown if increasing array size by too much at one time (browser dependent)
			Array.prototype.push.apply(array, new Array(increaseBy).fill(fill));
			return array;
		} catch (error) {
			// Reduce increase size and try again
			const reducer: number = (increaseBy / 2) | 0;

			while (increaseBy > 0) {
				GamingCanvasUtilArrayExpand(array, Math.min(reducer, increaseBy));
				increaseBy -= reducer;
			}
		}
	} else {
		return array;
	}
};

/**
 * Scale value between two ranges
 *
 * EG: value = 8
 * 		fromMin = 0, fromMax = 10
 * 		  toMin = 0,   toMax = 100
 * 		return is 80
 */
export const GamingCanvasUtilScale = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) => {
	return ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
};
