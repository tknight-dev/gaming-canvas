import { GamingCanvasFIFOQueue } from '../fifo-queue';
import { GamingCanvasInput, GamingCanvasInputType } from '../input';

/**
 * @author tknight-dev
 */

export interface GamingCanvasInputGamepad extends GamingCanvasInput {
	propriatary: {
		axes?: number[];
		buttons?: { [key: number]: boolean };
		connected: boolean;
		id: string;
		idCustom: number;
		type: GamingCanvasInputGamepadControllerType;
	};
}

export enum GamingCanvasInputGamepadControllerType {
	UNKNOWN,
	XBOX,
}

export interface GamingCanvasInputGamepadControllerTypeXboxAxes {
	stickLeftX: number;
	stickLeftY: number;
	stickRightX: number;
	stickRightY: number;
	triggerLeft: number;
	triggerRight: number;
}

/**
 * It's always faster
 */
let xboxToAxesFailed: boolean;
export const GamingCanvasInputGamepadControllerTypeXboxToAxes = (input: GamingCanvasInputGamepad): GamingCanvasInputGamepadControllerTypeXboxAxes => {
	try {
		const axes: number[] = <number[]>input.propriatary.axes;

		return {
			stickLeftX: axes[0],
			stickLeftY: axes[1],
			stickRightX: axes[4],
			stickRightY: axes[5],
			triggerLeft: axes[7],
			triggerRight: axes[6],
		};
	} catch (error) {
		// Throw a one time error to prevent overloading the console with 1000s of the same thing
		if (!xboxToAxesFailed) {
			xboxToAxesFailed = true;
			console.error(
				`GamingCanvas > GamingCanvasInputGamepadControllerTypeXboxToAxes: failed to convert input [type=${GamingCanvasInputGamepadControllerType[input.type]}]`,
			);
		}

		return {
			stickLeftX: 0,
			stickLeftY: 0,
			stickRightX: 0,
			stickRightY: 0,
			triggerLeft: 0,
			triggerRight: 0,
		};
	}
};

export enum GamingCanvasInputGamepadControllerTypeXboxButtons {
	A = 0,
	B = 1,
	BUMPER_LEFT = 4,
	BUMPER_RIGHT = 5,
	DPAD_DOWN = 13,
	DPAD_LEFT = 14,
	DPAD_RIGHT = 15,
	DPAD_UP = 12,
	HOME = 16,
	MENU = 9,
	STICK_LEFT = 10,
	STICK_RIGHT = 11,
	VIEW = 8,
	X = 3,
	Y = 2,
}

export interface GamingCanvasInputGamepadState {
	axisCount: number;
	buttonCount: number;
	connected: boolean;
	idCustom: number;
	timestamp: number;
	type: GamingCanvasInputGamepadControllerType;
}

export class GamingCanvasGamepadEngine {
	public static active: boolean = true;
	private static axesByIdCustom: { [key: number]: number[] } = {};
	private static buttonsByIdCustom: { [key: number]: boolean[] } = {};
	private static counter: number = 0;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static quit: boolean;
	private static scannerRequest: number;
	private static states: { [key: string]: GamingCanvasInputGamepadState } = {};

	public static initialize(queue: GamingCanvasFIFOQueue<GamingCanvasInput>, deadbandStick: number, deadbandTrigger: number): void {
		xboxToAxesFailed = false;
		GamingCanvasGamepadEngine.active = true;
		GamingCanvasGamepadEngine.queue = queue;
		GamingCanvasGamepadEngine.quit = false;

		/*
		 * Connection
		 */
		const connectionChange = (event: GamepadEvent) => {
			/*
			 * State
			 */
			const gamepad: Gamepad = event.gamepad,
				connected: boolean = gamepad.connected,
				id: string = gamepad.id;
			let state: GamingCanvasInputGamepadState = GamingCanvasGamepadEngine.states[id];

			if (state) {
				state.connected = connected;
				state.timestamp = gamepad.timestamp;
			} else {
				GamingCanvasGamepadEngine.states[id] = {
					axisCount: gamepad.axes.length / 2,
					buttonCount: gamepad.buttons.length,
					connected: connected,
					idCustom: GamingCanvasGamepadEngine.counter++,
					timestamp: gamepad.timestamp,
					type: GamingCanvasInputGamepadControllerType.UNKNOWN,
				};
				state = GamingCanvasGamepadEngine.states[id];

				const idLowerCase: string = id.toLowerCase();
				if (idLowerCase.includes('xbox') || idLowerCase.includes('x-box') || idLowerCase.includes('x_box')) {
					state.type = GamingCanvasInputGamepadControllerType.XBOX;
				}
			}
			GamingCanvasGamepadEngine.axesByIdCustom[state.idCustom] = new Array(gamepad.axes.length).fill(0);
			GamingCanvasGamepadEngine.buttonsByIdCustom[state.idCustom] = new Array(gamepad.buttons.length).fill(0);

			/*
			 * Queue
			 */
			if (GamingCanvasGamepadEngine.active) {
				GamingCanvasGamepadEngine.queue.push({
					propriatary: {
						connected: connected,
						id: id,
						idCustom: state.idCustom,
						type: state.type,
					},
					type: GamingCanvasInputType.GAMEPAD,
				});
			}
		};

		addEventListener('gamepadconnected', connectionChange);
		addEventListener('gamepaddisconnected', connectionChange);

		/*
		 * Scanner
		 */
		let axes: number[],
			buttons: boolean[],
			buttonsChanged: { [key: number]: boolean } | undefined,
			changedAxes: boolean,
			changedButtons: boolean,
			gamepads: (Gamepad | null)[],
			gamepad: Gamepad | null,
			i: number,
			idCustom: number,
			id: string,
			state: GamingCanvasInputGamepadState,
			timestamp: number = 0,
			value: number;

		const axesByIdCustom: { [key: number]: number[] } = GamingCanvasGamepadEngine.axesByIdCustom,
			buttonsByIdCustom: { [key: number]: boolean[] } = GamingCanvasGamepadEngine.buttonsByIdCustom,
			states: { [key: string]: GamingCanvasInputGamepadState } = GamingCanvasGamepadEngine.states;
		const scanner = (timestampNow: number) => {
			// Always request the next animation frame before processing the current one for best performance
			GamingCanvasGamepadEngine.scannerRequest = requestAnimationFrame(scanner);

			// Limit how often we check for inputs. Controllers can be really chatty on the communication bus.
			if (GamingCanvasGamepadEngine.active === true && timestampNow - timestamp > 4) {
				gamepads = navigator.getGamepads();
				timestamp = timestampNow;

				for (gamepad of gamepads) {
					if (GamingCanvasGamepadEngine.quit !== true && gamepad !== null) {
						id = gamepad.id;
						state = states[id];

						// New input for processing!
						if (gamepad.timestamp !== state.timestamp) {
							idCustom = state.idCustom;
							state.timestamp = gamepad.timestamp;

							// Axis
							axes = axesByIdCustom[idCustom];
							changedAxes = false;
							for (i = 0; i < gamepad.axes.length; i++) {
								value = gamepad.axes[i];

								// Xbox specific adjustments
								if (state.type === GamingCanvasInputGamepadControllerType.XBOX) {
									if (i < 6) {
										// Apply to sticks
										if (value > -deadbandStick && value < deadbandStick) {
											changedAxes = true;
											value = 0;
										} else {
											value *= -1;
										}
									} else {
										// Apply to triggers
										value = (value + 1) / 2; // convert range from -1-to-1 to 0-to-1

										if (value < deadbandTrigger) {
											changedAxes = true;
											value = 0;
										}
									}
								}

								if (axes[i] !== value) {
									axes[i] = value;
									changedAxes = true;
								}
							}

							// Buttons
							buttons = buttonsByIdCustom[idCustom];
							buttonsChanged = undefined;
							changedButtons = false;
							for (i = 0; i < gamepad.buttons.length; i++) {
								if (buttons[i] !== gamepad.buttons[i].pressed) {
									buttons[i] = gamepad.buttons[i].pressed;

									if (buttonsChanged === undefined) {
										buttonsChanged = <{ [key: number]: boolean }>new Object();
									}
									buttonsChanged[i] = buttons[i];
									changedButtons = true;
								}
							}

							if (changedAxes || changedButtons) {
								GamingCanvasGamepadEngine.queue.push({
									propriatary: {
										axes: changedAxes ? axes : undefined,
										buttons: buttonsChanged,
										connected: gamepad.connected,
										id: id,
										idCustom: idCustom,
										type: state.type,
									},
									type: GamingCanvasInputType.GAMEPAD,
								});
							}
						}
					}
				}
			}
		};
		GamingCanvasGamepadEngine.scannerRequest = requestAnimationFrame(scanner);
	}

	/**
	 * @return key is gamepadId
	 */
	public static getGamepads(): { [key: string]: GamingCanvasInputGamepadState } {
		return JSON.parse(JSON.stringify(GamingCanvasGamepadEngine.states));
	}

	public static shutdown(): void {
		cancelAnimationFrame(GamingCanvasGamepadEngine.scannerRequest);
		GamingCanvasGamepadEngine.quit = true;
	}
}
