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
		device: string;
		id: string;
		idCustom: number;
		vendor: string;
	};
}

/**
 * Convert raw axes array to something identified nicely
 *
 * @return null if the mapping failed
 */
export const GamingCanvasInputGamepadControllerAxesMapper = (input: GamingCanvasInputGamepad): GamingCanvasInputGamepadControllerAxes | null => {
	if (input.propriatary.vendor !== '?') {
		const axes: number[] = <number[]>input.propriatary.axes;

		try {
			return {
				stickLeftX: axes[0],
				stickLeftY: axes[1],
				stickRightX: axes[4],
				stickRightY: axes[5],
				triggerLeft: axes[7],
				triggerRight: axes[6],
			};
		} catch (error) {
			console.error(
				`GamingCanvas > GamingCanvasInputGamepadControllerAxesMapper: failed [id=${input.propriatary.id}, device=${input.propriatary.device}, vendor=${input.propriatary.vendor}]`,
			);
			return null;
		}
	} else {
		console.error(
			`GamingCanvas > GamingCanvasInputGamepadControllerAxesMapper: unsupported [id=${input.propriatary.id}, device=${input.propriatary.device}, vendor=${input.propriatary.vendor}]`,
		);
		return null;
	}
};

export interface GamingCanvasInputGamepadControllerAxes {
	stickLeftX: number;
	stickLeftY: number;
	stickRightX: number;
	stickRightY: number;
	triggerLeft: number;
	triggerRight: number;
}

/**
 * Format: XboxName__PlaystationName
 */
export enum GamingCanvasInputGamepadControllerButtons {
	A__X = 0,
	B__O = 1,
	BUMPER__LEFT = 4,
	BUMPER__RIGHT = 5,
	DPAD__DOWN = 13,
	DPAD__LEFT = 14,
	DPAD__RIGHT = 15,
	DPAD__UP = 12,
	HOME__HOME = 16,
	MENU__OPTIONS = 9,
	SHARE__ = 17,
	STICK__LEFT = 10,
	STICK__RIGHT = 11,
	VIEW__SHARE = 8,
	X__TRIANGE = 3,
	Y__SQUARE = 2,
}

export interface GamingCanvasInputGamepadState {
	axisCount: number;
	buttonCount: number;
	connected: boolean;
	description: string;
	device: string;
	idCustom: number;
	timestamp: number;
	vendor: string;
}

export class GamingCanvasEngineGamepad {
	public static active: boolean = true;
	private static axesByIdCustom: { [key: number]: number[] } = {};
	private static buttonsByIdCustom: { [key: number]: boolean[] } = {};
	private static gamepadByIdCustom: { [key: number]: Gamepad } = {};
	private static counter: number = 0;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static quit: boolean;
	private static scannerRequest: number;
	private static statesById: { [key: string]: GamingCanvasInputGamepadState } = {};

	// public static hapticEffect(): void {}

	// public static hapticPulse(idCustom: number, durationInMs: number, hapticActuator: number, intensity: number): void {
	// 	const gamepad: Gamepad = GamingCanvasEngineGamepad.gamepadByIdCustom[idCustom];

	// 	if (gamepad) {
	// 		const hapticActuatorCount: number = GamingCanvasEngineGamepad.statesById[gamepad.id].hapticActuatorCount;

	// 		if (hapticActuatorCount !== 0) {
	// 			hapticActuator = Math.max(0, hapticActuator);

	// 			if (hapticActuator < hapticActuatorCount) {
	// 				durationInMs = Math.max(0, durationInMs);
	// 				intensity = Math.max(0, Math.min(1, intensity));

	// 				(<any>gamepad).hapticActuators[hapticActuator].pulse(intensity, durationInMs);
	// 			} else {
	// 				console.error(`GamingCanvas > hapticPulse: hapticActuator ${hapticActuator} isn't within the known amount ${hapticActuatorCount}`);
	// 			}
	// 		} else {
	// 			console.error('GamingCanvas > hapticPulse: gamepad has no haptic actuators or none are supported by this browser', idCustom);
	// 		}
	// 	} else {
	// 		console.error('GamingCanvas > hapticPulse: unknown gamepad id-custom', idCustom);
	// 	}
	// }

	public static initialize(queue: GamingCanvasFIFOQueue<GamingCanvasInput>, deadbandStick: number, deadbandTrigger: number): void {
		GamingCanvasEngineGamepad.active = true;
		GamingCanvasEngineGamepad.queue = queue;
		GamingCanvasEngineGamepad.quit = false;

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
			let state: GamingCanvasInputGamepadState = GamingCanvasEngineGamepad.statesById[id];

			if (state) {
				state.connected = connected;
				state.timestamp = gamepad.timestamp;
			} else {
				GamingCanvasEngineGamepad.statesById[id] = {
					axisCount: gamepad.axes.length / 2,
					buttonCount: gamepad.buttons.length,
					connected: connected,
					description: id.substring(9, id.length).replace('-', ''),
					device: id.substring(5, 9).toUpperCase(),
					idCustom: GamingCanvasEngineGamepad.counter++,
					timestamp: gamepad.timestamp,
					vendor: id.substring(0, 4).toUpperCase(),
				};
				state = GamingCanvasEngineGamepad.statesById[id];
			}
			GamingCanvasEngineGamepad.axesByIdCustom[state.idCustom] = new Array(gamepad.axes.length).fill(0);
			GamingCanvasEngineGamepad.buttonsByIdCustom[state.idCustom] = new Array(gamepad.buttons.length).fill(false);
			GamingCanvasEngineGamepad.gamepadByIdCustom[state.idCustom] = gamepad;

			/*
			 * Queue
			 */
			if (GamingCanvasEngineGamepad.active) {
				GamingCanvasEngineGamepad.queue.push({
					propriatary: {
						connected: connected,
						device: state.device,
						id: id,
						idCustom: state.idCustom,
						vendor: state.vendor,
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

		const axesByIdCustom: { [key: number]: number[] } = GamingCanvasEngineGamepad.axesByIdCustom,
			buttonsByIdCustom: { [key: number]: boolean[] } = GamingCanvasEngineGamepad.buttonsByIdCustom,
			statesById: { [key: string]: GamingCanvasInputGamepadState } = GamingCanvasEngineGamepad.statesById;
		const scanner = (timestampNow: number) => {
			// Always request the next animation frame before processing the current one for best performance
			GamingCanvasEngineGamepad.scannerRequest = requestAnimationFrame(scanner);

			// Limit how often we check for inputs. Controllers can be really chatty on the communication bus.
			if (GamingCanvasEngineGamepad.active === true && timestampNow - timestamp > 4) {
				gamepads = navigator.getGamepads();
				timestamp = timestampNow;

				for (gamepad of gamepads) {
					if (GamingCanvasEngineGamepad.quit !== true && gamepad !== null) {
						id = gamepad.id;
						state = statesById[id];

						// New input for processing!
						if (gamepad.timestamp !== state.timestamp) {
							idCustom = state.idCustom;
							state.timestamp = gamepad.timestamp;

							// Axis
							axes = axesByIdCustom[idCustom];
							changedAxes = false;
							for (i = 0; i < gamepad.axes.length; i++) {
								value = gamepad.axes[i];

								if (i < 6) {
									// Apply to sticks
									if (value > -deadbandStick && value < deadbandStick) {
										value = 0;
									} else {
										value *= -1;
									}
								} else {
									// Apply to triggers
									value = (value + 1) / 2; // convert range from -1-to-1 to 0-to-1

									if (value < deadbandTrigger) {
										value = 0;
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
								GamingCanvasEngineGamepad.queue.push({
									propriatary: {
										axes: changedAxes ? axes : undefined,
										buttons: buttonsChanged,
										connected: gamepad.connected,
										device: state.device,
										id: id,
										idCustom: idCustom,
										vendor: state.vendor,
									},
									type: GamingCanvasInputType.GAMEPAD,
								});
							}
						}
					}
				}
			}
		};
		GamingCanvasEngineGamepad.scannerRequest = requestAnimationFrame(scanner);
	}

	public static getGamepads(): { [key: string]: GamingCanvasInputGamepadState } {
		return JSON.parse(JSON.stringify(GamingCanvasEngineGamepad.statesById));
	}

	public static shutdown(): void {
		cancelAnimationFrame(GamingCanvasEngineGamepad.scannerRequest);
		GamingCanvasEngineGamepad.quit = true;
	}
}
