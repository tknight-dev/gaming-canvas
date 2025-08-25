import { GamingCanvasFIFOQueue } from '../fifo-queue';
import { GamingCanvasInput, GamingCanvasInputType } from '../input';

/**
 * Gamepad Axes support removed. Every controller is represented differently by each browser.
 *
 * @author tknight-dev
 */

export interface GamingCanvasInputGamepad extends GamingCanvasInput {
	propriatary: {
		buttons?: { [key: number]: boolean };
		connected: boolean;
		device: string;
		id: string;
		idCustom: number;
		vendor: string;
	};
}

/**
 * Format: Name or XboxName__PlaystationName
 */
export enum GamingCanvasInputGamepadControllerButtons {
	A__X = 0,
	B__O = 1,
	BUMPER_LEFT = 4,
	BUMPER_RIGHT = 5,
	DPAD_DOWN = 13,
	DPAD_LEFT = 14,
	DPAD_RIGHT = 15,
	DPAD_UP = 12,
	HOME_HOME = 16,
	MENU_OPTIONS = 9,
	// SHARE__ = 17,
	STICK__LEFT = 10,
	STICK__RIGHT = 11,
	VIEW__SHARE = 8,
	X__TRIANGE = 3,
	Y__SQUARE = 2,
}

export interface GamingCanvasInputGamepadState {
	connected: boolean;
	device: string;
	idCustom: number;
	timestamp: number;
	vendor: string;
}

export class GamingCanvasEngineGamepad {
	public static active: boolean = true;
	private static buttonsByIdCustom: { [key: number]: boolean[] } = {};
	private static gamepadByIdCustom: { [key: number]: Gamepad } = {};
	private static counter: number = 0;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static quit: boolean;
	private static scannerRequest: number;
	private static statesById: { [key: string]: GamingCanvasInputGamepadState } = {};

	public static initialize(queue: GamingCanvasFIFOQueue<GamingCanvasInput>): void {
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
				// Set state
				GamingCanvasEngineGamepad.statesById[id] = {
					connected: connected,
					device: id.substring(5, 9).toUpperCase(),
					idCustom: GamingCanvasEngineGamepad.counter++,
					timestamp: gamepad.timestamp,
					vendor: id.substring(0, 4).toUpperCase(),
				};
				state = GamingCanvasEngineGamepad.statesById[id];
			}
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
		let buttons: boolean[],
			buttonsChanged: { [key: number]: boolean } | undefined,
			changed: boolean,
			gamepads: (Gamepad | null)[],
			gamepad: Gamepad | null,
			i: number,
			idCustom: number,
			id: string,
			state: GamingCanvasInputGamepadState,
			timestamp: number = 0;

		const buttonsByIdCustom: { [key: number]: boolean[] } = GamingCanvasEngineGamepad.buttonsByIdCustom,
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

							// Buttons
							buttons = buttonsByIdCustom[idCustom];
							buttonsChanged = undefined;
							changed = false;
							for (i = 0; i < gamepad.buttons.length; i++) {
								if (buttons[i] !== gamepad.buttons[i].pressed) {
									buttons[i] = gamepad.buttons[i].pressed;

									if (buttonsChanged === undefined) {
										buttonsChanged = <{ [key: number]: boolean }>new Object();
									}
									buttonsChanged[i] = buttons[i];
									changed = true;
								}
							}

							if (changed) {
								GamingCanvasEngineGamepad.queue.push({
									propriatary: {
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
