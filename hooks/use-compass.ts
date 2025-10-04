import Constants from "expo-constants";
import { Accelerometer, Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

export interface CompassData {
	heading: number; // 0–360 rounded for display
	accuracy: number;
	isCalibrated: boolean;
	cardinalDirection: string;
	cardinalAbbreviation: string;
	rotationDeg: number; // continuous (unwrapped) degrees for smooth animation
	// Optional tilt data (present when accelerometer is available)
	rollDeg?: number;
	pitchDeg?: number;
	tiltDeg?: number; // overall tilt from flat
	isLevel?: boolean;
	// Raw magnetometer data (for calibration tracking)
	magX?: number;
	magY?: number;
	magZ?: number;
}

export interface CompassState {
	data: CompassData | null;
	isAvailable: boolean;
	isLoading: boolean;
	error: string | null;
}

const CARDINAL_DIRECTIONS = [
	{ name: "North", abbr: "N", min: 337.5, max: 22.5 },
	{ name: "Northeast", abbr: "NE", min: 22.5, max: 67.5 },
	{ name: "East", abbr: "E", min: 67.5, max: 112.5 },
	{ name: "Southeast", abbr: "SE", min: 112.5, max: 157.5 },
	{ name: "South", abbr: "S", min: 157.5, max: 202.5 },
	{ name: "Southwest", abbr: "SW", min: 202.5, max: 247.5 },
	{ name: "West", abbr: "W", min: 247.5, max: 292.5 },
	{ name: "Northwest", abbr: "NW", min: 292.5, max: 337.5 },
];

// Smoothing filter to reduce jitter
class SmoothingFilter {
	private values: number[] = [];
	private readonly maxSize: number;

	constructor(size: number = 5) {
		this.maxSize = size;
	}

	add(value: number): number {
		this.values.push(value);
		if (this.values.length > this.maxSize) {
			this.values.shift();
		}

		// Handle circular averaging for angles
		let sinSum = 0;
		let cosSum = 0;

		for (const angle of this.values) {
			sinSum += Math.sin((angle * Math.PI) / 180);
			cosSum += Math.cos((angle * Math.PI) / 180);
		}

		const avgAngle = Math.atan2(
			sinSum / this.values.length,
			cosSum / this.values.length,
		);
		let result = (avgAngle * 180) / Math.PI;

		// Normalize to 0-360
		if (result < 0) result += 360;

		return result;
	}

	clear() {
		this.values = [];
	}
}

function calculateHeading(x: number, y: number, _z: number): number {
	// Compute heading with 0° at magnetic North, increasing clockwise
	// atan2 returns angle from +X axis; shift by +90° to make 0° = +Y (North)
	let heading = 90 - (Math.atan2(y, x) * 180) / Math.PI;

	// Normalize to 0–360
	heading %= 360;
	if (heading < 0) heading += 360;

	return heading;
}

function getCardinalDirection(heading: number): { name: string; abbr: string } {
	for (const direction of CARDINAL_DIRECTIONS) {
		if (direction.name === "North") {
			// Special case for North (wraps around 0)
			if (heading >= direction.min || heading <= direction.max) {
				return { name: direction.name, abbr: direction.abbr };
			}
		} else {
			if (heading >= direction.min && heading < direction.max) {
				return { name: direction.name, abbr: direction.abbr };
			}
		}
	}

	return { name: "North", abbr: "N" }; // Fallback
}

type CompassOptions = {
	updateInterval?: number;
	axisFlipEW?: boolean;
	useCrossProduct?: boolean;
	simulatedHeading?: number; // For simulator mode - set specific heading
};
export function useCompass(options?: number | CompassOptions): CompassState {
	const opts: CompassOptions =
		typeof options === "number" ? { updateInterval: options } : (options ?? {});
	const updateMs = opts.updateInterval ?? 100;
	const axisFlipEW = !!opts.axisFlipEW;
	const useCross = opts.useCrossProduct !== false; // default true
	const simulatedHeading = opts.simulatedHeading;

	// Detect if running in iOS Simulator
	// Constants.isDevice: false/undefined = simulator, true = real device
	// Constants.executionEnvironment: 'storeClient' = Expo Go, 'standalone' = production
	// For development: isDevice is undefined and executionEnvironment is 'storeClient' in simulator
	// For production: isDevice is false and executionEnvironment is 'standalone' in simulator
	const isSimulator =
		(Constants.isDevice === false || Constants.isDevice === undefined) &&
		(Constants.executionEnvironment === "standalone" || Constants.executionEnvironment === "storeClient");

	const [state, setState] = useState<CompassState>({
		data: null,
		isAvailable: false,
		isLoading: true,
		error: null,
	});

	const smoothingFilter = useRef(new SmoothingFilter(8));
	const magSubscriptionRef = useRef<{ remove: () => void } | null>(null);
	const accelSubscriptionRef = useRef<{ remove: () => void } | null>(null);
	const latestAccelRef = useRef<{ ax: number; ay: number; az: number } | null>(
		null,
	);
	const accelLPRef = useRef<{ ax: number; ay: number; az: number } | null>(
		null,
	);
	const magHistoryRef = useRef<number[]>([]);
	const emaMagRef = useRef<number | null>(null);
	const displayAccRef = useRef<number>(0);
	const rotationAccumRef = useRef<number>(0); // continuous rotation degrees for animation

	const prevHeadingRef = useRef<number | null>(null);

	useEffect(() => {
		let isMounted = true;

		const initializeCompass = async () => {
			try {
				// SIMULATION MODE: If in simulator and simulatedHeading is provided
				if (isSimulator && simulatedHeading !== undefined) {
					const { name: cardinalDirection, abbr: cardinalAbbreviation } =
						getCardinalDirection(simulatedHeading);

					setState({
						data: {
							heading: Math.round(simulatedHeading),
							accuracy: 100, // Perfect accuracy in simulation
							isCalibrated: true,
							cardinalDirection,
							cardinalAbbreviation,
							rotationDeg: simulatedHeading,
							isLevel: true,
							tiltDeg: 0,
							rollDeg: 0,
							pitchDeg: 0,
						},
						isAvailable: true,
						isLoading: false,
						error: null,
					});
					return;
				}

				// Check if device supports magnetometer
				const isAvailable = await Magnetometer.isAvailableAsync();

				if (!isMounted) return;

				if (!isAvailable) {
					// If in simulator, provide helpful message
					const errorMsg = isSimulator
						? "Simulator mode: Pass simulatedHeading prop to useCompass to test"
						: "Magnetometer not available on this device";

					setState({
						data: null,
						isAvailable: false,
						isLoading: false,
						error: errorMsg,
					});
					return;
				}

				// Set update interval(s)
				Magnetometer.setUpdateInterval(updateMs);

				// Try to enable accelerometer if available (for tilt compensation)
				let accelAvailable = false;
				try {
					accelAvailable = await Accelerometer.isAvailableAsync();
				} catch {}

				let accelSub: { remove: () => void } | null = null;
				if (accelAvailable) {
					Accelerometer.setUpdateInterval(updateMs);
					accelSub = Accelerometer.addListener(
						({ x, y, z }: { x: number; y: number; z: number }) => {
							if (!isMounted) return;
							const alpha = 0.15;
							const prev = accelLPRef.current ?? { ax: x, ay: y, az: z };
							const ax = alpha * x + (1 - alpha) * prev.ax;
							const ay = alpha * y + (1 - alpha) * prev.ay;
							const az = alpha * z + (1 - alpha) * prev.az;
							const norm = Math.hypot(ax, ay, az) || 1;
							accelLPRef.current = {
								ax: ax / norm,
								ay: ay / norm,
								az: az / norm,
							};
							latestAccelRef.current = accelLPRef.current;
						},
					);
				}

				// Start listening to magnetometer
				const magSub = Magnetometer.addListener(({ x, y, z }) => {
					if (!isMounted) return;

					let rawHeading: number;
					const accel = latestAccelRef.current;
					if (accel) {
						const { ax, ay, az } = accel; // already low-pass filtered and normalized
						if (useCross) {
							// Cross-product fusion: E = M x A; N = A x E
							const Ex = y * az - z * ay;
							const Ey = z * ax - x * az;
							const Ez = x * ay - y * ax;
							const eNorm = Math.hypot(Ex, Ey, Ez) || 1;
							const ex = Ex / eNorm,
								ey = Ey / eNorm,
								ez = Ez / eNorm;
							// North vector
							const Nx = ay * ez - az * ey;
							const Ny = az * ex - ax * ez;
							// Heading: 0 at North, clockwise
							rawHeading = 90 - (Math.atan2(Ny, Nx) * 180) / Math.PI;
						} else {
							// Legacy tilt compensation via roll/pitch
							const roll = Math.atan2(ay, az);
							const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
							const Xh = x * Math.cos(pitch) + z * Math.sin(pitch);
							const Yh =
								x * Math.sin(roll) * Math.sin(pitch) +
								y * Math.cos(roll) -
								z * Math.sin(roll) * Math.cos(pitch);
							rawHeading = 90 - (Math.atan2(Yh, Xh) * 180) / Math.PI;
						}
					} else {
						rawHeading = calculateHeading(x, y, z);
					}
					// Normalize
					rawHeading %= 360;
					if (rawHeading < 0) rawHeading += 360;
					// Optional axis correction (E/W swap)
					if (axisFlipEW) rawHeading = (360 - rawHeading) % 360;

					let smoothedHeading = smoothingFilter.current.add(rawHeading);

					// Build a more stable accuracy metric from field strength + variance + tilt
					const magnitude = Math.sqrt(x * x + y * y + z * z);
					// EMA of magnitude to suppress flicker
					const magAlpha = 0.1;
					emaMagRef.current =
						emaMagRef.current == null
							? magnitude
							: magAlpha * magnitude + (1 - magAlpha) * emaMagRef.current;
					// Keep short history for variance estimate
					magHistoryRef.current.push(magnitude);
					if (magHistoryRef.current.length > 60) magHistoryRef.current.shift();
					const hist = magHistoryRef.current;
					const mean =
						hist.reduce((a, b) => a + b, 0) / Math.max(hist.length, 1);
					const variance =
						hist.length > 1
							? hist.reduce((a, b) => a + (b - mean) * (b - mean), 0) /
								(hist.length - 1)
							: 0;
					const stddev = Math.sqrt(variance);
					// Score 1: field strength proximity to [30,60] µT
					const m = emaMagRef.current;
					let fieldScore = 0;
					if (m <= 15 || m >= 90) fieldScore = 0;
					else if (m < 30) fieldScore = 100 * ((m - 15) / 15);
					else if (m <= 60)
						fieldScore = 100; // ideal band
					else fieldScore = Math.max(0, 100 - ((m - 60) / 30) * 100);
					// Score 2: stability (lower stddev is better)
					const varianceScore = Math.max(0, 100 - Math.min(100, stddev * 50));

					// Compute tilt metrics if accel available
					let rollDeg: number | undefined;
					let pitchDeg: number | undefined;
					let tiltDeg: number | undefined;
					let isLevel: boolean | undefined;
					if (latestAccelRef.current) {
						const { ax, ay, az } = latestAccelRef.current;
						const roll = Math.atan2(ay, az);
						const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
						rollDeg = (roll * 180) / Math.PI;
						pitchDeg = (pitch * 180) / Math.PI;
						tiltDeg = Math.min(90, Math.hypot(rollDeg, pitchDeg));
						isLevel = tiltDeg < 7;
					}

					// Score 3: tilt (start reducing beyond ~15°)
					let tiltScore = 100;
					if (typeof tiltDeg === "number") {
						const over = Math.max(0, tiltDeg - 15);
						tiltScore = Math.max(0, 100 - over * 3);
					}

					// Combine and smooth for display
					let accuracy =
						0.5 * fieldScore + 0.3 * varianceScore + 0.2 * tiltScore;
					const accAlpha = 0.25;
					displayAccRef.current =
						accAlpha * accuracy +
						(1 - accAlpha) * (displayAccRef.current ?? accuracy);
					accuracy = displayAccRef.current;

					// Step limiter to prevent random spins during poor signal/high tilt
					const prev = prevHeadingRef.current;
					if (prev != null) {
						// shortest signed delta in [-180,180]
						const delta = ((smoothedHeading - prev + 540) % 360) - 180;
						let maxStep = accuracy < 50 ? 20 : 45; // stricter when accuracy low
						// When device is level, be extra conservative to prevent visible spins
						if (isLevel === true) {
							maxStep = Math.min(maxStep, 10);
						} else if (typeof tiltDeg === "number" && tiltDeg < 25) {
							maxStep = Math.min(maxStep, 15);
						}
						if (Math.abs(delta) > maxStep) {
							smoothedHeading = prev + Math.sign(delta) * maxStep;
							// normalize
							smoothedHeading = ((smoothedHeading % 360) + 360) % 360;
						}
					}
					// Update continuous rotation accumulator for smooth animation
					if (prev != null) {
						const deltaForRot = ((smoothedHeading - prev + 540) % 360) - 180;
						rotationAccumRef.current += deltaForRot;
					} else {
						rotationAccumRef.current = smoothedHeading;
					}
					prevHeadingRef.current = smoothedHeading;

					const { name: cardinalDirection, abbr: cardinalAbbreviation } =
						getCardinalDirection(smoothedHeading);

					const compassData: CompassData = {
						heading: Math.round(smoothedHeading),
						accuracy: Math.round(accuracy),
						isCalibrated: accuracy > 60,
						cardinalDirection,
						cardinalAbbreviation,
						rotationDeg: rotationAccumRef.current,
						rollDeg,
						pitchDeg,
						tiltDeg,
						isLevel,
						magX: x,
						magY: y,
						magZ: z,
					};

					setState({
						data: compassData,
						isAvailable: true,
						isLoading: false,
						error: null,
					});
				});

				magSubscriptionRef.current = magSub;
				accelSubscriptionRef.current = accelSub;

				setState((prev) => ({
					...prev,
					isAvailable: true,
					isLoading: false,
				}));
			} catch (error) {
				if (!isMounted) return;

				setState({
					data: null,
					isAvailable: false,
					isLoading: false,
					error:
						error instanceof Error
							? error.message
							: "Failed to initialize compass",
				});
			}
		};

		initializeCompass();

		return () => {
			isMounted = false;
			if (magSubscriptionRef.current) {
				magSubscriptionRef.current.remove();
				magSubscriptionRef.current = null;
			}
			if (accelSubscriptionRef.current) {
				accelSubscriptionRef.current.remove();
				accelSubscriptionRef.current = null;
			}
			smoothingFilter.current.clear();
		};
	}, [updateMs, axisFlipEW, useCross, isSimulator, simulatedHeading]);

	return state;
}
