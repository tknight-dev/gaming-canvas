import { GamingCanvasFIFOQueue } from '../fifo-queue';

/**
 * The user must interact with the page before the browser will allow the audio to play
 *
 * Provide multiple buffers for controlling and overlaying single audio assets
 *
 * @author tknight-dev
 */

interface Buffer {
	audio: HTMLAudioElement;
	id: number;
	panner: StereoPannerNode;
	source: MediaElementAudioSourceNode;
	type?: GamingCanvasAudioType;
}

interface Fader {
	audio: HTMLAudioElement;
	id: number;
	panner: StereoPannerNode;
	source: MediaElementAudioSourceNode;
	type?: GamingCanvasAudioType;
}

export enum GamingCanvasAudioType {
	ALL,
	EFFECT,
	MUSIC,
}

export class GamingCanvasEngineAudio {
	private static assets: Map<number, HTMLAudioElement> = new Map();
	private static buffers: Buffer[];
	private static buffersAvailable: GamingCanvasFIFOQueue<Buffer> = new GamingCanvasFIFOQueue<Buffer>();
	private static callbackIsPermitted: (state: boolean) => void;
	private static context: AudioContext = new AudioContext();
	private static enabled: boolean = false;
	private static faders: Fader[];
	private static muted: boolean = false;
	private static permission: boolean = false;
	private static permissionInterval: ReturnType<typeof setInterval>;
	private static permissionSample: HTMLAudioElement;
	private static request: number;
	private static volumeAll: number = 1;
	private static volumeEffect: number = 0.8;
	private static volumeEffectEff: number = GamingCanvasEngineAudio.volumeEffect;
	private static volumeMusic: number = 1;
	private static volumeMusicEff: number = GamingCanvasEngineAudio.volumeMusic;

	/**
	 * Set the specific audio instance's volume
	 *
	 * @param bufferId is the number returned by the controlPlay() function
	 * @param pan is -1 left, 0 center, 1 right
	 * @param durationInMs is how long it takes to apply the new value completely (default is 0 milliseconds)
	 */
	public static controlPan(bufferId: number, pan: number, durationInMs: number = 0): void {
		if (bufferId < 0 || bufferId >= GamingCanvasEngineAudio.buffers.length) {
			console.error(`GamingCanvas > GamingCanvasEngineAudio > controlVolume: buffer id ${bufferId} is invalid`);
		} else {
			const buffer: Buffer = GamingCanvasEngineAudio.buffers[bufferId];

			if (!buffer.audio.ended) {
				pan = Math.max(-1, Math.min(1, pan));

				buffer.panner.pan.setValueAtTime(pan, 0);
			}
		}
	}

	/**
	 * Suspend playing the audio without ending it, or resume audio where you suspended it
	 *
	 * @param bufferId is the number returned by the controlPlay() function
	 * @param state true = pause, false = unpause
	 */
	public static controlPause(bufferId: number, state: boolean): void {
		if (bufferId < 0 || bufferId >= GamingCanvasEngineAudio.buffers.length) {
			console.error(`GamingCanvas > GamingCanvasEngineAudio > controlPause: buffer id ${bufferId} is invalid`);
		} else {
			const buffer: Buffer = GamingCanvasEngineAudio.buffers[bufferId];

			if (!buffer.audio.ended) {
				state ? buffer.audio.play() : buffer.audio.pause();
			}
		}
	}

	/**
	 * If an audio buffer is available, via the availibility FIFO queue, then the asset will be loaded into the buffer and played from that source
	 *
	 * @param effect (default is true) [false implies music]
	 * @param loop (default is false)
	 * @param pan is -1 left, 0 center, 1 right (default is 0)
	 * @param positionInS is between 0 and the duration of the audio asset in seconds (default is 0)
	 * @param volume is between 0 and 1 (default is 1)
	 * @return is bufferId, use this to modify the active audio (null on failure)
	 */
	public static async controlPlay(
		assetId: number,
		effect: boolean = true,
		loop: boolean = false,
		pan: number = 0,
		positionInS: number = 0,
		volume: number = 1,
	): Promise<number | null> {
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

		let audio: HTMLAudioElement,
			volumeGlobal: number = effect === true ? GamingCanvasEngineAudio.volumeEffectEff : GamingCanvasEngineAudio.volumeMusicEff,
			volumeEff: number = volumeGlobal * volume;

		// Apply bounds
		pan = Math.max(-1, Math.min(1, pan));
		positionInS = Math.max(0, Math.min(asset.duration, positionInS));
		volume = Math.max(0, Math.min(1, volume));

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
		buffer.panner.pan.setValueAtTime(pan, 0);
		buffer.type = effect === true ? GamingCanvasAudioType.EFFECT : GamingCanvasAudioType.MUSIC;

		// Play
		await audio.play();
		return buffer.id;
	}

	/**
	 * Stop the audio and return the buffer to the availability FIFO queue
	 *
	 * @param bufferId is the number returned by the controlPlay() function
	 */
	public static controlStop(bufferId: number): void {
		if (bufferId < 0 || bufferId >= GamingCanvasEngineAudio.buffers.length) {
			console.error(`GamingCanvas > GamingCanvasEngineAudio > controlStop: buffer id ${bufferId} is invalid`);
		} else {
			const buffer: Buffer = GamingCanvasEngineAudio.buffers[bufferId];

			if (!buffer.audio.ended) {
				buffer.audio.loop = false;
				buffer.audio.currentTime = buffer.audio.duration;
			}
		}
	}

	/**
	 * Set the specific audio instance's volume
	 *
	 * @param bufferId is the number returned by the controlPlay() function
	 * @param volume is between 0 and 1
	 * @param durationInMs is how long it takes to apply the new value completely (default is 0 milliseconds)
	 */
	public static controlVolume(bufferId: number, volume: number, durationInMs: number = 0): void {
		if (bufferId < 0 || bufferId >= GamingCanvasEngineAudio.buffers.length) {
			console.error(`GamingCanvas > GamingCanvasEngineAudio > controlVolume: buffer id ${bufferId} is invalid`);
		} else {
			const buffer: Buffer = GamingCanvasEngineAudio.buffers[bufferId];

			if (!buffer.audio.ended) {
				volume = Math.max(0, Math.min(1, volume));
				volume *= buffer.type === GamingCanvasAudioType.EFFECT ? GamingCanvasEngineAudio.volumeEffectEff : GamingCanvasEngineAudio.volumeMusicEff;

				buffer.audio.volume = volume;
			}
		}
	}

	public static initialize(enable: boolean, bufferCount: number): void {
		GamingCanvasEngineAudio.enabled = enable;
		if (!enable) {
			cancelAnimationFrame(GamingCanvasEngineAudio.request);
			return;
		}

		if (GamingCanvasEngineAudio.buffers === undefined) {
			GamingCanvasEngineAudio.buffers = new Array(bufferCount);
			GamingCanvasEngineAudio.faders = new Array(bufferCount);
			GamingCanvasEngineAudio.initializeBuffersAndFaders(bufferCount);
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
	}

	private static initializeBuffersAndFaders(bufferCount: number): void {
		let audio: HTMLAudioElement,
			buffers: Buffer[] = GamingCanvasEngineAudio.buffers,
			buffersAvailable: GamingCanvasFIFOQueue<Buffer> = GamingCanvasEngineAudio.buffersAvailable,
			context: AudioContext = GamingCanvasEngineAudio.context,
			i: number,
			panner: StereoPannerNode,
			source: MediaElementAudioSourceNode;

		const add = (buffer: Buffer) => {
			buffers[buffer.id] = buffer;

			// OnEnded: Put buffer back in queue
			buffer.audio.onended = () => {
				buffersAvailable.push(buffer);
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
			add({
				audio: audio,
				id: i,
				panner: panner,
				source: source,
			});
		}
	}

	/**
	 * @param assets Map<identifing number, Blob/DataURL/URL>
	 */
	public static async load(assets: Map<number, string>): Promise<void> {
		let id: number,
			promises: Promise<void>[] = new Array(assets.size),
			promisesIndex: number = 0,
			src: string;

		// Attach the src to a HTMLAudioElement
		const loader = async (id: number, src: string) => {
			let audio: HTMLAudioElement = new Audio(),
				resolver: any;

			const loaded = () => {
				audio.removeEventListener('canplaythrough', loaded, false);
				resolver();
			};

			return new Promise<void>((resolve: any) => {
				resolver = resolve;

				// Prepare to cache and callback when ready
				GamingCanvasEngineAudio.assets.set(id, audio);
				audio.addEventListener('canplaythrough', loaded, false);
				audio.preload = 'auto'; // Indicates that the whole audio file can be downloaded, even if the user is not expected to use it (MDN)

				try {
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
			buffers: Buffer[] = GamingCanvasEngineAudio.buffers,
			differencePercentage: number;

		// Make sure it's in range
		volume = Math.max(0, Math.min(1, volume));

		// Apply to global volumnes
		switch (type) {
			case GamingCanvasAudioType.ALL:
				differencePercentage = volume / GamingCanvasEngineAudio.volumeAll;

				GamingCanvasEngineAudio.volumeAll = volume;
				GamingCanvasEngineAudio.volumeEffectEff = GamingCanvasEngineAudio.volumeEffect * GamingCanvasEngineAudio.volumeAll;
				GamingCanvasEngineAudio.volumeMusicEff = GamingCanvasEngineAudio.volumeMusic * GamingCanvasEngineAudio.volumeAll;
				break;
			case GamingCanvasAudioType.EFFECT:
				differencePercentage = volume / GamingCanvasEngineAudio.volumeEffect;

				GamingCanvasEngineAudio.volumeEffect = volume;
				GamingCanvasEngineAudio.volumeEffectEff = GamingCanvasEngineAudio.volumeEffect * GamingCanvasEngineAudio.volumeAll;
				break;
			case GamingCanvasAudioType.MUSIC:
				differencePercentage = volume / GamingCanvasEngineAudio.volumeMusic;

				GamingCanvasEngineAudio.volumeMusic = volume;
				GamingCanvasEngineAudio.volumeMusicEff = GamingCanvasEngineAudio.volumeMusic * GamingCanvasEngineAudio.volumeAll;
				break;
		}

		// Apply volume difference to buffers, as required
		for (buffer of buffers) {
			if (type === GamingCanvasAudioType.ALL || buffer.type === type) {
				buffer.audio.volume *= differencePercentage;
			}
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
