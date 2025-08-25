import { GamingCanvasFIFOQueue } from '../fifo-queue';
import { GamingCanvasInput, GamingCanvasInputType } from '../input';

/**
 * Triggers are axes in Firefox and buttons in Chrome
 *
 * @author tknight-dev
 */

export interface GamingCanvasInputGamepad extends GamingCanvasInput {
	propriatary: {
		axes?: number[];
		buttons?: { [key: number]: boolean };
		connected: boolean;
		index: number;
	};
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
	STICK__LEFT = 10,
	STICK__RIGHT = 11,
	TRIGGER__LEFT = 6,
	TRIGGER__RIGHT = 7,
	VIEW__SHARE = 8,
	X__TRIANGE = 3,
	Y__SQUARE = 2,
}

export enum GamingCanvasInputGamepadControllerVender {
	MICROSOFT = '045E',
	SONY = '054C',
}

export interface GamingCanvasInputGamepadState {
	connected: boolean;
	idDevice: string;
	idVendor: string;
	timestamp: number;
}

export class GamingCanvasEngineGamepad {
	public static active: boolean = true;
	private static axesByIndex: { [key: number]: number[] } = {};
	private static buttonsByIndex: { [key: number]: boolean[] } = {};
	private static gamepadByIndex: { [key: number]: Gamepad } = {};
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static quit: boolean;
	private static scannerRequest: number;
	private static statesByIndex: { [key: number]: GamingCanvasInputGamepadState } = {};

	public static initialize(queue: GamingCanvasFIFOQueue<GamingCanvasInput>, deadband: number): void {
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
				id: string = gamepad.id,
				index: number = gamepad.index;
			let state: GamingCanvasInputGamepadState = GamingCanvasEngineGamepad.statesByIndex[index];

			if (state) {
				state.connected = connected;
				state.timestamp = gamepad.timestamp;
			} else {
				GamingCanvasEngineGamepad.statesByIndex[index] = {
					connected: connected,
					idDevice: id.substring(5, 9).toUpperCase(),
					idVendor: id.substring(0, 4).toUpperCase(),
					timestamp: gamepad.timestamp,
				};
				state = GamingCanvasEngineGamepad.statesByIndex[index];
				console.log('state', state);
			}
			GamingCanvasEngineGamepad.axesByIndex[index] = new Array(4).fill(0);
			GamingCanvasEngineGamepad.buttonsByIndex[index] = new Array(gamepad.buttons.length).fill(false);
			GamingCanvasEngineGamepad.gamepadByIndex[index] = gamepad;

			/*
			 * Queue
			 */
			if (GamingCanvasEngineGamepad.active) {
				GamingCanvasEngineGamepad.queue.push({
					propriatary: {
						connected: connected,
						index: index,
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
			firefox: boolean = navigator.userAgent.toLowerCase().includes('firefox'),
			gamepads: (Gamepad | null)[],
			gamepad: Gamepad | null,
			i: number,
			index: number,
			state: GamingCanvasInputGamepadState,
			timestamp: number = 0,
			value: number;

		const axesByIndex: { [key: number]: number[] } = GamingCanvasEngineGamepad.axesByIndex,
			buttonsByIndex: { [key: number]: boolean[] } = GamingCanvasEngineGamepad.buttonsByIndex,
			statesByIndex: { [key: number]: GamingCanvasInputGamepadState } = GamingCanvasEngineGamepad.statesByIndex;
		const scanner = (timestampNow: number) => {
			// Always request the next animation frame before processing the current one for best performance
			GamingCanvasEngineGamepad.scannerRequest = requestAnimationFrame(scanner);

			// Limit how often we check for inputs. Controllers can be really chatty on the communication bus.
			if (GamingCanvasEngineGamepad.active === true && timestampNow - timestamp > 4) {
				gamepads = navigator.getGamepads();
				timestamp = timestampNow;

				for (gamepad of gamepads) {
					if (GamingCanvasEngineGamepad.quit !== true && gamepad !== null) {
						index = gamepad.index;
						state = statesByIndex[index];

						// New input for processing!
						if (gamepad.timestamp !== state.timestamp) {
							state.timestamp = gamepad.timestamp;

							// Axis
							axes = axesByIndex[index];
							changedAxes = false;

							// Firefox: skip triggers as Chrome treats them as buttons
							for (i = 0; i < Math.min(4, gamepad.axes.length); i++) {
								if (firefox && state.idVendor === GamingCanvasInputGamepadControllerVender.MICROSOFT && i > 1) {
									// Fix for Firefox bug of detecting another axes between the left and right stick for xbox controllers
									value = gamepad.axes[i + 2];
								} else {
									value = gamepad.axes[i];
								}

								if (value > -deadband && value < deadband) {
									value = 0;
								}

								if (axes[i] !== value) {
									axes[i] = value;
									changedAxes = true;
								}
							}

							// Buttons
							buttons = buttonsByIndex[index];
							buttonsChanged = undefined;
							changedButtons = false;
							for (i = 0; i < gamepad.buttons.length; i++) {
								if (i === 6 || i === 7) {
									// Chrome: skip triggers as Firefox treats them as axes
									continue;
								}

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
										index: index,
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
		return JSON.parse(JSON.stringify(GamingCanvasEngineGamepad.statesByIndex));
	}

	public static shutdown(): void {
		cancelAnimationFrame(GamingCanvasEngineGamepad.scannerRequest);
		GamingCanvasEngineGamepad.quit = true;
	}
}
