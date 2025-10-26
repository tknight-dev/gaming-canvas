import { GamingCanvasDoubleLinkedListNode } from '../double-linked-list.js';
import { GamingCanvasFIFOQueue } from '../fifo-queue.js';

/**
 * The user must interact with the page before the browser will allow the audio to play
 *
 * Provide multiple buffers for controlling and overlaying single audio assets
 *
 * @author tknight-dev
 */

interface Buffer {
	assetId?: number;
	audio: HTMLAudioElement;
	available: boolean;
	callbackDone?: (bufferId: number) => void;
	id: number;
	instance: number;
	faderNode?: GamingCanvasDoubleLinkedListNode<Fader>;
	panner: StereoPannerNode;
	source: MediaElementAudioSourceNode;
	type?: GamingCanvasAudioType;
	volumeRequested: number;
}

interface Fader {
	active: boolean;
	id: number;
	panCallback?: (bufferId: number) => void;
	panRequested: number;
	panSteps: number;
	panStepValue: number;
	pause: boolean;
	volumeCallback?: (bufferId: number) => void;
	volumeLimit: number;
	volumeRequested: number;
	volumeRequestedEff: number;
	volumeSteps: number;
	volumeStepValue: number;
}

export enum GamingCanvasAudioType {
	ALL,
	AMBIENCE,
	EFFECT,
	MUSIC,
	VOICEOVER,
}

// Allows for blocking
const bufferCallbackPromise = async (instance: number, callback: (bufferId: number) => void): Promise<void> => {
	return new Promise((resolve: any) => {
		setTimeout(() => {
			resolve();
			callback(instance);
		});
	});
};

// Non-blocking
const faderCallback = (instance: number, callback: (bufferId: number) => void, faderInternal: Fader, pan: boolean) => {
	if (pan) {
		faderInternal.panCallback = undefined;
	} else {
		faderInternal.volumeCallback = undefined;
	}
	setTimeout(() => {
		callback(instance);
	});
};

// Allows for blocking
const faderCallbackPromise = async (instance: number, callback: (bufferId: number) => void, faderInternal: Fader, pan: boolean): Promise<void> => {
	if (pan) {
		faderInternal.panCallback = undefined;
	} else {
		faderInternal.volumeCallback = undefined;
	}
	return new Promise((resolve: any) => {
		setTimeout(() => {
			resolve();
			callback(instance);
		});
	});
};

const faderReset = (fader: Fader) => {
	fader.active = false;
	fader.panCallback = undefined;
	fader.panRequested = 0;
	fader.panSteps = 0;
	fader.panStepValue = 0;
	fader.pause = false;
	fader.volumeCallback = undefined;
	fader.volumeLimit = 0;
	fader.volumeRequested = 0;
	fader.volumeRequestedEff = 0;
	fader.volumeSteps = 0;
	fader.volumeStepValue = 0;
};

export class GamingCanvasEngineAudio {
	private static assets: Map<number, HTMLAudioElement> = new Map();
	private static buffers: Buffer[];
	private static buffersAvailable: GamingCanvasFIFOQueue<Buffer> = new GamingCanvasFIFOQueue();
	private static buffersByInstanceId: Map<number, Buffer> = new Map();
	private static callbackIsPermitted: (state: boolean) => void;
	private static context: AudioContext;
	private static enabled: boolean = false;
	private static faders: Fader[];
	private static fadersActive: Set<number> = new Set();
	private static goIntervalInMs: number = 20;
	private static muted: boolean = false;
	private static permission: boolean = false;
	private static permissionInterval: ReturnType<typeof setInterval>;
	private static permissionSample: HTMLAudioElement;
	private static request: number;
	private static volumeAll: number = 1;
	private static volumeAmbience: number = 0.6;
	private static volumeAmbienceEff: number = GamingCanvasEngineAudio.volumeAmbience;
	private static volumeEffect: number = 0.8;
	private static volumeEffectEff: number = GamingCanvasEngineAudio.volumeEffect;
	private static volumeMusic: number = 1;
	private static volumeMusicEff: number = GamingCanvasEngineAudio.volumeMusic;
	private static volumeVoiceover: number = 1;
	private static volumeVoiceoverEff: number = GamingCanvasEngineAudio.volumeVoiceover;

	private static go(_timestampNow: number): void {}
	private static go__funcForward(): void {
		let buffer: Buffer,
			buffers: Buffer[] = GamingCanvasEngineAudio.buffers,
			changed: boolean,
			fader: Fader,
			faderId: number,
			faders: Fader[] = GamingCanvasEngineAudio.faders,
			fadersActive: Set<number> = GamingCanvasEngineAudio.fadersActive,
			intervalInMs: number = GamingCanvasEngineAudio.goIntervalInMs,
			limit: number,
			timestampDelta: number,
			timestampThen: number = 0;

		const go = (timestampNow: number) => {
			// Always load the next frame first
			GamingCanvasEngineAudio.request = requestAnimationFrame(go);

			// Faders
			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta > intervalInMs) {
				timestampThen = timestampNow - (timestampDelta % intervalInMs);

				// Process them
				for (faderId of fadersActive) {
					fader = faders[faderId];

					if (!fader.active || fader.pause) {
						continue;
					}
					buffer = buffers[faderId];
					changed = false;

					if (fader.panSteps !== 0) {
						changed = true;
						fader.panSteps--;

						if (fader.panSteps === 0) {
							buffer.panner.pan.setValueAtTime(fader.panRequested, 0);
							fader.panCallback !== undefined && faderCallback(buffer.instance, fader.panCallback, fader, true);
						} else {
							buffer.panner.pan.setValueAtTime(Math.max(-1, Math.min(1, buffer.panner.pan.value + fader.panStepValue)), 0);
						}
					}

					if (fader.volumeSteps !== 0) {
						changed = true;
						fader.volumeSteps--;

						switch (buffer.type) {
							case GamingCanvasAudioType.AMBIENCE:
								limit = GamingCanvasEngineAudio.volumeAmbienceEff;
								break;
							case GamingCanvasAudioType.EFFECT:
								limit = GamingCanvasEngineAudio.volumeEffectEff;
								break;
							case GamingCanvasAudioType.MUSIC:
								limit = GamingCanvasEngineAudio.volumeMusicEff;
								break;
							case GamingCanvasAudioType.VOICEOVER:
								limit = GamingCanvasEngineAudio.volumeVoiceoverEff;
								break;
						}

						if (fader.volumeLimit !== limit) {
							fader.volumeLimit = limit;
							fader.volumeRequestedEff = fader.volumeRequested * limit;
							fader.volumeStepValue = Math.abs(buffer.audio.volume - fader.volumeRequestedEff) / fader.volumeSteps;

							if (buffer.audio.volume > fader.volumeRequestedEff) {
								fader.volumeStepValue *= -1;
							}
						}

						if (fader.volumeSteps === 0) {
							buffer.audio.volume = fader.volumeRequestedEff;
							fader.volumeCallback !== undefined && faderCallback(buffer.instance, fader.volumeCallback, fader, false);
						} else {
							buffer.audio.volume = Math.max(0, Math.min(1, buffer.audio.volume + fader.volumeStepValue));
						}
					}

					if (changed === false) {
						fader.active = false;
						fadersActive.delete(faderId);
					}
				}
			}
		};
		GamingCanvasEngineAudio.go = go;
	}

	/**
	 * Set the specific audio instance's volume
	 *
	 * @param instance is the number returned by the controlPlay() function. Invalid instances are ignored
	 * @param pan is -1 left, 0 center, 1 right
	 * @param durationInMs is how long it takes to apply the new value completely (default is 0 milliseconds)
	 * @param callback is triggered when audio or fader is complete
	 */
	public static controlPan(instance: number, pan: number, durationInMs: number = 0, callback?: (instance: number) => void): void {
		const buffer: Buffer = <Buffer>GamingCanvasEngineAudio.buffersByInstanceId.get(instance);

		if (buffer !== undefined) {
			if (!buffer.audio.ended) {
				let panCurrent: number = buffer.panner.pan.value;
				pan = Math.max(-1, Math.min(1, pan));

				if (pan > panCurrent - 0.01 && pan < panCurrent + 0.01) {
					// The change request is too small
					callback && callback(buffer.instance);
					return;
				}
				durationInMs = Math.max(0, durationInMs);

				// Don't fade if the request duration is less than the goIntervalInMs
				if (durationInMs > GamingCanvasEngineAudio.goIntervalInMs) {
					const fader: Fader = GamingCanvasEngineAudio.faders[buffer.id];

					// Duration can't be more than twice as long as the audio source is
					durationInMs = Math.min((<HTMLAudioElement>GamingCanvasEngineAudio.assets.get(<number>buffer.assetId)).duration * 2000, durationInMs);

					// Set the fader parameters
					fader.active = true;
					fader.panCallback = callback;
					fader.panSteps = ((durationInMs / GamingCanvasEngineAudio.goIntervalInMs) | 0) + 1; // Make sure we at least overshoot the target
					fader.panStepValue = Math.abs(panCurrent - pan) / fader.panSteps;
					fader.panRequested = pan;

					if (panCurrent > pan) {
						fader.panStepValue *= -1;
					}

					// Done
					GamingCanvasEngineAudio.fadersActive.add(buffer.id);
				} else {
					buffer.panner.pan.setValueAtTime(pan, 0);
					callback && callback(buffer.instance);
				}
			}
		}
	}

	/**
	 * Suspend playing the audio without ending it, or resume audio where you suspended it
	 *
	 * @param instance is the number returned by the controlPlay() function. Invalid instances are ignored
	 * @param state true = pause, false = unpause
	 */
	public static controlPause(instance: number, state: boolean): void {
		const buffer: Buffer = <Buffer>GamingCanvasEngineAudio.buffersByInstanceId.get(instance);

		if (buffer !== undefined) {
			if (!buffer.audio.ended) {
				state === true ? buffer.audio.pause() : buffer.audio.play();
				GamingCanvasEngineAudio.faders[buffer.id].pause = state;
			}
		}
	}

	/**
	 * Suspend playing the audio without ending it, or resume audio where you suspended it
	 *
	 * @param state true = pause, false = unpause
	 */
	public static controlPauseAll(state: boolean): void {
		let buffer: Buffer;

		for (buffer of GamingCanvasEngineAudio.buffersByInstanceId.values()) {
			if (!buffer.audio.ended) {
				state === true ? buffer.audio.pause() : buffer.audio.play();
				GamingCanvasEngineAudio.faders[buffer.id].pause = state;
			}
		}
	}

	/**
	 * If an audio buffer is available, via the availibility FIFO queue, then the asset will be loaded into the buffer and played from that source
	 *
	 * @param assetId is the id of the audio file in cache to be played
	 * @param type (default is EFFECT)
	 * @param loop (default is false)
	 * @param pan is -1 left, 0 center, 1 right (default is 0)
	 * @param positionInS is between 0 and the duration of the audio asset in seconds (default is 0)
	 * @param volume is between 0 and 1 (default is 1)
	 * @param callback is triggered when audio is complete
	 * @return is instance, use this to modify the active audio (null on failure)
	 */
	public static async controlPlay(
		assetId: number,
		type: GamingCanvasAudioType = GamingCanvasAudioType.EFFECT,
		loop: boolean = false,
		pan: number = 0,
		positionInS: number = 0,
		volume?: number,
		callback?: (instance: number) => void,
	): Promise<number | null> {
		if (GamingCanvasEngineAudio.enabled !== true) {
			console.error(`GamingCanvas > GamingCanvasEngineAudio > controlPlay: audio not enabled [see options]`);
			return null;
		} else if (GamingCanvasEngineAudio.permission !== true) {
			console.error(`GamingCanvas > GamingCanvasEngineAudio > controlPlay: audio not permitted`);
			return null;
		}

		const asset: HTMLAudioElement | undefined = GamingCanvasEngineAudio.assets.get(assetId);
		if (asset === undefined) {
			console.error(`GamingCanvas > GamingCanvasEngineAudio > controlPlay: assetId ${assetId} is invalid`);
			return null;
		}

		const buffer: Buffer | undefined = GamingCanvasEngineAudio.buffersAvailable.pop();
		if (buffer === undefined) {
			console.error(`GamingCanvas > GamingCanvasEngineAudio > controlPlay: buffer underflow`);
			return null;
		}

		let audio: HTMLAudioElement, volumeGlobal: number, volumeEff: number;

		switch (type) {
			case GamingCanvasAudioType.AMBIENCE:
				volumeGlobal = GamingCanvasEngineAudio.volumeAmbienceEff;
				break;
			case GamingCanvasAudioType.EFFECT:
				volumeGlobal = GamingCanvasEngineAudio.volumeEffectEff;
				break;
			case GamingCanvasAudioType.MUSIC:
				volumeGlobal = GamingCanvasEngineAudio.volumeMusicEff;
				break;
			case GamingCanvasAudioType.VOICEOVER:
				volumeGlobal = GamingCanvasEngineAudio.volumeVoiceoverEff;
				break;
			default:
				console.error(`GamingCanvas > GamingCanvasEngineAudio > controlPlay: unknown type ${type}`);
				return null;
		}

		volumeEff = volumeGlobal * (volume === undefined ? 1 : volume);

		// Apply bounds
		pan = Math.max(-1, Math.min(1, pan));
		positionInS = Math.max(0, Math.min(asset.duration, positionInS));
		volumeEff = Math.max(0, Math.min(1, volumeEff));

		// Load buffer source
		audio = buffer.audio;
		audio.pause(); // Shouldn't be necessary, but hey
		audio.src = asset.src;

		// Config: Audio
		audio.currentTime = positionInS;
		audio.loop = loop === true;
		audio.muted = GamingCanvasEngineAudio.muted;
		audio.volume = volumeEff;

		// Config: Buffer
		buffer.assetId = assetId;
		buffer.available = false;
		((buffer.callbackDone = callback), buffer.panner.pan.setValueAtTime(pan, 0));
		buffer.volumeRequested = volumeEff;

		// Keep randomizing until a unique number is generated
		buffer.instance = (Math.random() * Number.MAX_SAFE_INTEGER) | 0;
		while (buffer.instance === 0 || GamingCanvasEngineAudio.buffersByInstanceId.has(buffer.instance) === true) {
			buffer.instance = (Math.random() * Number.MAX_SAFE_INTEGER) | 0;
		}
		GamingCanvasEngineAudio.buffersByInstanceId.set(buffer.instance, buffer);

		buffer.type = type;

		// Config: Fader
		faderReset(GamingCanvasEngineAudio.faders[buffer.id]);

		// Play
		await audio.play();
		return buffer.instance;
	}

	/**
	 * Stop the audio and return the buffer to the availability FIFO queue
	 *
	 * @param instance is the number returned by the controlPlay() function. Invalid instances are ignored
	 */
	public static controlStop(instance: number): void {
		const buffer: Buffer = <Buffer>GamingCanvasEngineAudio.buffersByInstanceId.get(instance);

		if (buffer !== undefined) {
			// callbacks triggered by 'audio.onended' event
			if (!buffer.audio.ended) {
				// Buffer
				buffer.audio.loop = false;
				buffer.audio.currentTime = buffer.audio.duration;

				// Fader
				GamingCanvasEngineAudio.fadersActive.delete(buffer.id);
			}
		}
	}

	/**
	 * Stop the audio and return the buffer to the availability FIFO queue
	 *
	 * @param type specify a specific type to stop (default is all types)
	 */
	public static controlStopAll(type: GamingCanvasAudioType = GamingCanvasAudioType.ALL): void {
		let buffer: Buffer;

		for (buffer of GamingCanvasEngineAudio.buffersByInstanceId.values()) {
			// callbacks triggered by 'audio.onended' event
			if (!buffer.audio.ended) {
				if (type === GamingCanvasAudioType.ALL || buffer.type === type) {
					// Buffer
					buffer.audio.loop = false;
					buffer.audio.currentTime = buffer.audio.duration || 0;

					// Fader
					GamingCanvasEngineAudio.fadersActive.delete(buffer.id);
				}
			}
		}
	}

	/**
	 * Set the specific audio instance's volume
	 *
	 * @param instance is the number returned by the controlPlay() function. Invalid instances are ignored
	 * @param volume is between 0 and 1
	 * @param durationInMs is how long it takes to apply the new value completely (default is 0 milliseconds)
	 * @param callback is triggered when audio or fader is complete
	 */
	public static controlVolume(instance: number, volume: number, durationInMs: number = 0, callback?: (instance: number) => void): void {
		const buffer: Buffer = <Buffer>GamingCanvasEngineAudio.buffersByInstanceId.get(instance);

		if (buffer !== undefined) {
			if (!buffer.audio.ended) {
				let volumeCurrent: number = buffer.audio.volume,
					volumeEff: number;

				volume = Math.max(0, Math.min(1, volume));
				volumeEff = volume;
				buffer.volumeRequested = volumeEff;

				switch (buffer.type) {
					case GamingCanvasAudioType.AMBIENCE:
						volumeEff *= GamingCanvasEngineAudio.volumeAmbienceEff;
						break;
					case GamingCanvasAudioType.EFFECT:
						volumeEff *= GamingCanvasEngineAudio.volumeEffectEff;
						break;
					case GamingCanvasAudioType.MUSIC:
						volumeEff *= GamingCanvasEngineAudio.volumeMusicEff;
						break;
					case GamingCanvasAudioType.VOICEOVER:
						volumeEff *= GamingCanvasEngineAudio.volumeVoiceoverEff;
						break;
				}

				if (volumeEff > volumeCurrent - 0.01 && volumeEff < volumeCurrent + 0.01) {
					// The change request is too small
					callback && callback(buffer.instance);
					return;
				}

				// Don't fade if the request duration is less than the goIntervalInMs
				if (durationInMs > GamingCanvasEngineAudio.goIntervalInMs) {
					const fader: Fader = GamingCanvasEngineAudio.faders[buffer.id];

					// Duration can't be more than twice as long as the audio source is
					durationInMs = Math.min((<HTMLAudioElement>GamingCanvasEngineAudio.assets.get(<number>buffer.assetId)).duration * 2000, durationInMs);

					// Set the fader parameters
					fader.active = true;
					fader.volumeCallback = callback;

					switch (buffer.type) {
						case GamingCanvasAudioType.AMBIENCE:
							fader.volumeLimit = GamingCanvasEngineAudio.volumeAmbienceEff;
							break;
						case GamingCanvasAudioType.EFFECT:
							fader.volumeLimit = GamingCanvasEngineAudio.volumeEffectEff;
							break;
						case GamingCanvasAudioType.MUSIC:
							fader.volumeLimit = GamingCanvasEngineAudio.volumeMusicEff;
							break;
						case GamingCanvasAudioType.VOICEOVER:
							fader.volumeLimit = GamingCanvasEngineAudio.volumeVoiceoverEff;
							break;
					}

					fader.volumeSteps = ((durationInMs / GamingCanvasEngineAudio.goIntervalInMs) | 0) + 1; // Make sure we at least overshoot the target
					fader.volumeStepValue = Math.abs(volumeCurrent - volumeEff) / fader.volumeSteps;
					fader.volumeRequested = volume;
					fader.volumeRequestedEff = volumeEff;

					if (volumeCurrent > volumeEff) {
						fader.volumeStepValue *= -1;
					}

					// Done
					GamingCanvasEngineAudio.fadersActive.add(buffer.id);
				} else {
					buffer.audio.volume = volumeEff;
					callback && callback(buffer.instance);
				}
			}
		}
	}

	public static isContext(): boolean {
		return GamingCanvasEngineAudio.context !== undefined;
	}

	public static initialize(enable: boolean, bufferCount: number, audioContext?: AudioContext): void {
		if (audioContext) {
			GamingCanvasEngineAudio.context = audioContext;
		}
		if (!enable) {
			GamingCanvasEngineAudio.enabled = false;
			cancelAnimationFrame(GamingCanvasEngineAudio.request);
			return;
		}

		// Only ever initialize this section once
		if (GamingCanvasEngineAudio.buffers === undefined) {
			// buffers
			GamingCanvasEngineAudio.buffers = new Array(bufferCount);
			GamingCanvasEngineAudio.faders = new Array(bufferCount);
			GamingCanvasEngineAudio.initializeBuffersAndFaders(bufferCount);

			// go functionFoward
			GamingCanvasEngineAudio.go__funcForward();
		}

		/**
		 * Create the audio sample for permission checking
		 */
		if (GamingCanvasEngineAudio.permissionSample === undefined) {
			GamingCanvasEngineAudio.permissionSample = new Audio();
			GamingCanvasEngineAudio.permissionSample.setAttribute('preload', 'auto');
			GamingCanvasEngineAudio.permissionSample.setAttribute(
				'src',
				'data:audio/mp3;base64,//MUxAAB4AWIoAgAATgAH4CA8PD1TEFN//MUxAMAAAGUAAAAAEUzLjEwMFVVVVVV',
			);
			GamingCanvasEngineAudio.permissionSample.volume = 0.01;
		}

		/**
		 * Poll the system for the play permission from the browser
		 */
		clearInterval(GamingCanvasEngineAudio.permissionInterval);
		GamingCanvasEngineAudio.permissionInterval = setInterval(async () => {
			let permission: boolean = true;

			try {
				await GamingCanvasEngineAudio.permissionSample.play();
			} catch (error: any) {
				permission = false;
			}

			if (GamingCanvasEngineAudio.permission !== permission) {
				GamingCanvasEngineAudio.permission = permission;

				if (GamingCanvasEngineAudio.callbackIsPermitted !== undefined) {
					GamingCanvasEngineAudio.callbackIsPermitted(permission);
				}
			}
		}, 1000);

		// Done
		if (GamingCanvasEngineAudio.enabled !== true) {
			GamingCanvasEngineAudio.enabled = true;
			GamingCanvasEngineAudio.request = requestAnimationFrame(GamingCanvasEngineAudio.go);
		}
	}

	private static initializeBuffersAndFaders(bufferCount: number): void {
		let audio: HTMLAudioElement,
			buffers: Buffer[] = GamingCanvasEngineAudio.buffers,
			buffersAvailable: GamingCanvasFIFOQueue<Buffer> = GamingCanvasEngineAudio.buffersAvailable,
			buffersByInstanceId: Map<number, Buffer> = GamingCanvasEngineAudio.buffersByInstanceId,
			context: AudioContext = GamingCanvasEngineAudio.context,
			faders: Fader[] = GamingCanvasEngineAudio.faders,
			i: number,
			panner: StereoPannerNode,
			source: MediaElementAudioSourceNode;

		const add = (buffer: Buffer, fader: Fader) => {
			buffers[buffer.id] = buffer;
			faders[fader.id] = fader;

			// OnEnded: Put buffer back in queue
			buffer.audio.onended = async () => {
				// Buffer
				buffer.callbackDone !== undefined && (await bufferCallbackPromise(buffer.instance, buffer.callbackDone));
				buffer.available = true;

				buffersByInstanceId.delete(buffer.instance);
				buffersAvailable.push(buffer);

				// Fader
				fader.panCallback !== undefined && (await faderCallbackPromise(buffer.instance, fader.panCallback, fader, true));
				fader.volumeCallback !== undefined && (await faderCallbackPromise(buffer.instance, fader.volumeCallback, fader, false));
				GamingCanvasEngineAudio.fadersActive.delete(buffer.id);
				faderReset(GamingCanvasEngineAudio.faders[buffer.id]);
			};

			// Done: Add the buffer to the queue
			buffersAvailable.push(buffer);
		};

		for (i = 0; i < bufferCount; i++) {
			// Create buffer stack
			audio = new Audio();
			panner = context.createStereoPanner();
			source = context.createMediaElementSource(audio);

			// Audio
			audio.preload = 'auto'; // Indicates that the whole audio file can be downloaded, even if the user is not expected to use it (MDN)

			// Wiring: source -> panner -> output
			source.connect(panner);
			panner.connect(context.destination);

			// Add itv
			add(
				{
					audio: audio,
					available: true,
					id: i,
					instance: -1,
					panner: panner,
					source: source,
					volumeRequested: 0,
				},
				{
					active: false,
					id: i,
					panRequested: 0,
					panSteps: 0,
					panStepValue: 0,
					pause: false,
					volumeLimit: 0,
					volumeRequested: 0,
					volumeRequestedEff: 0,
					volumeSteps: 0,
					volumeStepValue: 0,
				},
			);
		}
	}

	/**
	 * @param assets Map<identifing number, DataURL/URL>
	 */
	public static async load(assets: Map<number, string>): Promise<void> {
		let id: number,
			promises: Promise<void>[] = new Array(assets.size),
			promisesIndex: number = 0,
			src: string;

		// Attach the src to a HTMLAudioElement
		const loader = async (id: number, src: string) => {
			let audio: HTMLAudioElement = new Audio(),
				resolver: any,
				skip: boolean = false,
				timeout: ReturnType<typeof setTimeout>;

			const loaded = () => {
				clearTimeout(timeout);
				GamingCanvasEngineAudio.assets.set(id, audio);
				audio.removeEventListener('canplaythrough', loaded, false);

				// Took to long and the resolver() was triggered to keep things moving forward
				if (skip !== true) {
					resolver();
				}
			};

			return new Promise<void>((resolve: any) => {
				resolver = resolve;

				// Prepare to cache and callback when ready
				audio.addEventListener('canplaythrough', loaded, false);
				audio.preload = 'auto'; // Indicates that the whole audio file can be downloaded, even if the user is not expected to use it (MDN)

				try {
					timeout = setTimeout(() => {
						console.warn(`GamingCanvas > GamingCanvasEngineAudio > loader: asset ${id} is taking a long time to load [+5s] [size=${src.length}B]`);
						resolver();
						skip = true;
					}, 5000);

					// Start the loading process
					audio.setAttribute('src', src);
				} catch (error) {
					console.error(`GamingCanvas > GamingCanvasEngineAudio > loader: failed to load '${id}' with`, error);
					resolver();
				}
			});
		};

		// Start the load process
		for ([id, src] of assets) {
			promises[promisesIndex++] = loader(id, src);
		}

		// Wait for all the audio files to load (parallize loading)
		await Promise.all(promises);
	}

	/**
	 * Mute or unmute all audio
	 */
	public static mute(enable: boolean): void {
		let buffer: Buffer,
			buffers: Buffer[] = GamingCanvasEngineAudio.buffers;

		GamingCanvasEngineAudio.muted = enable;

		for (buffer of buffers) {
			buffer.audio.muted = enable;
		}
	}

	/**
	 * @param volume is between 0 and 1
	 */
	public static volumeGlobal(volume: number, type: GamingCanvasAudioType) {
		let buffer: Buffer,
			buffers: Buffer[] = GamingCanvasEngineAudio.buffers;

		try {
			// Make sure it's in range
			volume = Math.max(0, Math.min(1, volume));

			// Apply to global volumnes
			switch (type) {
				case GamingCanvasAudioType.ALL:
					GamingCanvasEngineAudio.volumeAll = volume;
					GamingCanvasEngineAudio.volumeAmbienceEff = GamingCanvasEngineAudio.volumeAmbience * GamingCanvasEngineAudio.volumeAll;
					GamingCanvasEngineAudio.volumeEffectEff = GamingCanvasEngineAudio.volumeEffect * GamingCanvasEngineAudio.volumeAll;
					GamingCanvasEngineAudio.volumeMusicEff = GamingCanvasEngineAudio.volumeMusic * GamingCanvasEngineAudio.volumeAll;
					GamingCanvasEngineAudio.volumeVoiceoverEff = GamingCanvasEngineAudio.volumeVoiceover * GamingCanvasEngineAudio.volumeAll;
					break;
				case GamingCanvasAudioType.AMBIENCE:
					GamingCanvasEngineAudio.volumeAmbience = volume;
					GamingCanvasEngineAudio.volumeAmbienceEff = GamingCanvasEngineAudio.volumeAmbience * GamingCanvasEngineAudio.volumeAll;
					break;
				case GamingCanvasAudioType.EFFECT:
					GamingCanvasEngineAudio.volumeEffect = volume;
					GamingCanvasEngineAudio.volumeEffectEff = GamingCanvasEngineAudio.volumeEffect * GamingCanvasEngineAudio.volumeAll;
					break;
				case GamingCanvasAudioType.MUSIC:
					GamingCanvasEngineAudio.volumeMusic = volume;
					GamingCanvasEngineAudio.volumeMusicEff = GamingCanvasEngineAudio.volumeMusic * GamingCanvasEngineAudio.volumeAll;
					break;
				case GamingCanvasAudioType.VOICEOVER:
					GamingCanvasEngineAudio.volumeVoiceover = volume;
					GamingCanvasEngineAudio.volumeVoiceoverEff = GamingCanvasEngineAudio.volumeVoiceover * GamingCanvasEngineAudio.volumeAll;
					break;
				default:
					console.error(`GamingCanvas > GamingCanvasEngineAudio > volumeGlobal: type ${type} is invalid`);
					return;
			}

			// Apply volume difference to buffers, as required
			for (buffer of buffers) {
				if (type === GamingCanvasAudioType.ALL || buffer.type === type) {
					switch (buffer.type) {
						case GamingCanvasAudioType.AMBIENCE:
							buffer.audio.volume = buffer.volumeRequested * GamingCanvasEngineAudio.volumeAmbienceEff;
							break;
						case GamingCanvasAudioType.EFFECT:
							buffer.audio.volume = buffer.volumeRequested * GamingCanvasEngineAudio.volumeEffectEff;
							break;
						case GamingCanvasAudioType.MUSIC:
							buffer.audio.volume = buffer.volumeRequested * GamingCanvasEngineAudio.volumeMusicEff;
							break;
						case GamingCanvasAudioType.VOICEOVER:
							buffer.audio.volume = buffer.volumeRequested * GamingCanvasEngineAudio.volumeVoiceoverEff;
							break;
					}
				}
			}
		} catch (error) {
			console.error(volume, GamingCanvasEngineAudio.volumeAll, error);
		}
	}

	public static setCallbackIsPermitted(callbackIsPermitted: (state: boolean) => void): void {
		GamingCanvasEngineAudio.callbackIsPermitted = callbackIsPermitted;
	}

	public static isMuted(): boolean {
		return GamingCanvasEngineAudio.muted;
	}

	public static isPermitted(): boolean {
		return GamingCanvasEngineAudio.permission;
	}
}
