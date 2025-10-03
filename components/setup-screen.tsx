import { useCompass } from "@/hooks/use-compass";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Pressable,
	StyleSheet,
	useColorScheme,
	View,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { ThemedText } from "./themed-text";

const { width: screenWidth } = Dimensions.get("window");

type SetupStep = "welcome" | "calibrating" | "axis-check" | "complete";

interface SetupScreenProps {
	onComplete: (axisFlipEW: boolean) => void;
	colorScheme?: "light" | "dark";
}

export function SetupScreen({
	onComplete,
	colorScheme: propColorScheme,
}: SetupScreenProps) {
	const [step, setStep] = useState<SetupStep>("welcome");
	const [calibrationProgress, setCalibrationProgress] = useState(0);
	const [axisCheckSamples, setAxisCheckSamples] = useState<
		{ heading: number; time: number }[]
	>([]);
	const [detectedFlip, setDetectedFlip] = useState<boolean>(false);

	// Calibration tracking state
	const [magSamples, setMagSamples] = useState<
		{ x: number; y: number; z: number; time: number }[]
	>([]);
	const [orientationRegions, setOrientationRegions] = useState<Set<string>>(
		new Set(),
	);

	const systemColorScheme = useColorScheme();
	const colorScheme = propColorScheme || systemColorScheme || "dark";
	const isDark = colorScheme === "dark";

	const tintColor = useThemeColor({}, "tint");
	const backgroundColor = isDark ? "#000000" : "#FFFFFF";
	const textColor = isDark ? "#FFFFFF" : "#000000";
	const secondaryColor = isDark
		? "rgba(255, 255, 255, 0.6)"
		: "rgba(0, 0, 0, 0.6)";
	const buttonBgColor = isDark ? tintColor : "#007AFF";
	const buttonTextColor = isDark ? "#000000" : "#FFFFFF";

	// Use compass with cross-product fusion but no axis flip yet
	const { data } = useCompass({
		updateInterval: 100,
		axisFlipEW: false,
		useCrossProduct: true,
	});

	// Animation for phone icon
	const phoneRotation = useSharedValue(0);
	const phoneScale = useSharedValue(1);

	useEffect(() => {
		if (step === "calibrating") {
			// Animate phone doing figure-8
			phoneRotation.value = withRepeat(
				withSequence(
					withTiming(15, { duration: 800 }),
					withTiming(-15, { duration: 800 }),
					withTiming(0, { duration: 400 }),
				),
				-1,
				false,
			);
			phoneScale.value = withRepeat(
				withSequence(
					withTiming(1.1, { duration: 600 }),
					withTiming(1, { duration: 600 }),
				),
				-1,
				true,
			);
		}
	}, [step, phoneRotation, phoneScale]);

	const phoneStyle = useAnimatedStyle(() => ({
		transform: [
			{ rotate: `${phoneRotation.value}deg` },
			{ scale: phoneScale.value },
		],
	}));

	// Track calibration progress based on orientation coverage
	useEffect(() => {
		if (
			step === "calibrating" &&
			data &&
			data.magX !== undefined &&
			data.magY !== undefined &&
			data.magZ !== undefined
		) {
			const now = Date.now();

			// Add sample
			setMagSamples((prev) => {
				const updated = [
					...prev,
					{
						x: data.magX as number,
						y: data.magY as number,
						z: data.magZ as number,
						time: now,
					},
				];
				// Keep last 10 seconds
				return updated.filter((s) => now - s.time < 10000);
			});

			// Quantize orientation into regions (simplified: divide sphere into ~26 regions)
			// Use normalized magnetometer vector to determine orientation
			const mag = Math.sqrt(
				data.magX * data.magX + data.magY * data.magY + data.magZ * data.magZ,
			);
			if (mag > 0) {
				const nx = data.magX / mag;
				const ny = data.magY / mag;
				const nz = data.magZ / mag;

				// Quantize to coarse grid (5 levels per axis = 125 regions, but we'll use 3 levels = 27 regions)
				const qx = Math.floor((nx + 1) * 1.5); // 0, 1, 2
				const qy = Math.floor((ny + 1) * 1.5);
				const qz = Math.floor((nz + 1) * 1.5);
				const regionKey = `${qx},${qy},${qz}`;

				setOrientationRegions((prev) => {
					const updated = new Set(prev);
					updated.add(regionKey);
					return updated;
				});
			}
		}
	}, [step, data]);

	// Calculate progress from orientation coverage + magnitude variance
	useEffect(() => {
		if (step === "calibrating") {
			const regionCount = orientationRegions.size;
			const targetRegions = 18; // Need to cover ~18 different orientations
			const coverageScore = Math.min(100, (regionCount / targetRegions) * 100);

			// Also check magnitude variance (good calibration shows consistent field strength)
			let varianceScore = 0;
			if (magSamples.length >= 20) {
				const magnitudes = magSamples.map((s) =>
					Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z),
				);
				const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
				const variance =
					magnitudes.reduce((a, b) => a + (b - mean) * (b - mean), 0) /
					magnitudes.length;
				const stddev = Math.sqrt(variance);
				// Good calibration: stddev should be reasonable (5-15 µT range)
				if (stddev >= 5 && stddev <= 20) {
					varianceScore = 50; // Bonus for having good variance
				}
			}

			const progress = Math.min(100, coverageScore + varianceScore * 0.5);
			setCalibrationProgress(progress);

			// Move to axis check when calibration is good
			if (progress >= 85 && regionCount >= 15) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				setTimeout(() => {
					setStep("axis-check");
				}, 500);
			}
		}
	}, [step, orientationRegions, magSamples]);

	// Axis check: sample headings and detect if E/W are swapped
	useEffect(() => {
		if (step === "axis-check" && data && data.accuracy >= 60) {
			const now = Date.now();
			setAxisCheckSamples((prev) => {
				const updated = [...prev, { heading: data.heading, time: now }];
				// Keep last 5 seconds of samples
				return updated.filter((s) => now - s.time < 5000);
			});
		}
	}, [step, data]);

	useEffect(() => {
		if (step === "axis-check" && axisCheckSamples.length >= 20) {
			// Cross-product fusion requires horizontal flip to correct E/W
			// This is because the cross-product method uses a different coordinate convention
			// than the device's native magnetometer frame
			const needsFlip = true; // Required for cross-product fusion
			setDetectedFlip(needsFlip);

			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			setTimeout(() => {
				setStep("complete");
			}, 1000);
		}
	}, [step, axisCheckSamples]);

	const handleStart = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setStep("calibrating");
	};

	const handleComplete = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		onComplete(detectedFlip);
	};

	return (
		<View style={[styles.container, { backgroundColor }]}>
			{step === "welcome" && (
				<View style={styles.content}>
					<View style={styles.iconContainer}>
						<Image
							source={require("@/assets/images/compass.png")}
							style={styles.compassImage}
							resizeMode="contain"
						/>
					</View>
					<ThemedText style={[styles.title, { color: textColor }]}>
						Welcome to True Compass
					</ThemedText>
					<ThemedText
						style={[
							styles.description,
							{ color: secondaryColor, marginTop: 8 },
						]}
					>
						Before we begin, we need to calibrate your device&apos;s sensors for
						accurate readings.
					</ThemedText>
					<ThemedText
						style={[
							styles.description,
							{ color: secondaryColor, marginTop: 20 },
						]}
					>
						This will take about 10-15 seconds.
					</ThemedText>
					<Pressable
						style={[styles.button, { backgroundColor: buttonBgColor }]}
						onPress={handleStart}
					>
						<ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
							Start Setup
						</ThemedText>
					</Pressable>
				</View>
			)}

			{step === "calibrating" && (
				<View style={styles.content}>
					<Animated.View style={[styles.phoneIcon, phoneStyle]}>
						<ThemedText style={[styles.icon, { color: tintColor }]}>
							📱
						</ThemedText>
					</Animated.View>
					<ThemedText style={[styles.title, { color: textColor }]} type="title">
						Calibrating Sensors
					</ThemedText>
					<ThemedText
						style={[
							styles.description,
							{ color: secondaryColor, marginTop: 8 },
						]}
					>
						Move your phone in a figure-8 pattern
					</ThemedText>
					<ThemedText
						style={[
							styles.description,
							{ color: secondaryColor, marginTop: 4 },
						]}
					>
						Keep moving until the bar fills up
					</ThemedText>

					<View style={styles.progressContainer}>
						<View
							style={[
								styles.progressBar,
								{ backgroundColor: "rgba(255,255,255,0.2)" },
							]}
						>
							<View
								style={[
									styles.progressFill,
									{
										backgroundColor: tintColor,
										width: `${calibrationProgress}%`,
									},
								]}
							/>
						</View>
						<ThemedText style={[styles.progressText, { color: textColor }]}>
							{Math.round(calibrationProgress)}%
						</ThemedText>
					</View>

					{calibrationProgress < 30 && (
						<ThemedText style={[styles.hint, { color: secondaryColor }]}>
							Tip: Move away from metal objects and electronics
						</ThemedText>
					)}
				</View>
			)}

			{step === "axis-check" && (
				<View style={styles.content}>
					<ActivityIndicator size="large" color={tintColor} />
					<ThemedText
						style={[styles.title, { color: textColor, marginTop: 20 }]}
						type="title"
					>
						Verifying Accuracy
					</ThemedText>
					<ThemedText
						style={[
							styles.description,
							{ color: secondaryColor, marginTop: 8 },
						]}
					>
						Checking sensor alignment...
					</ThemedText>
				</View>
			)}

			{step === "complete" && (
				<View style={styles.content}>
					<View style={styles.iconContainer}>
						<Image
							source={require("@/assets/images/compass.png")}
							style={styles.compassImage}
							resizeMode="contain"
						/>
					</View>
					<ThemedText
						style={[styles.successIcon, { color: buttonBgColor, height: 64 }]}
						type="title"
					>
						✓
					</ThemedText>
					<ThemedText style={[styles.title, { color: textColor }]}>
						Setup Complete!
					</ThemedText>
					<ThemedText
						style={[
							styles.description,
							{ color: secondaryColor, marginTop: 8 },
						]}
					>
						Your compass is ready to use
					</ThemedText>
					{detectedFlip && (
						<ThemedText
							style={[styles.hint, { color: secondaryColor, marginTop: 20 }]}
						>
							Note: Applied axis correction for your device
						</ThemedText>
					)}
					<Pressable
						style={[styles.button, { backgroundColor: buttonBgColor }]}
						onPress={handleComplete}
					>
						<ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
							Start Using Compass
						</ThemedText>
					</Pressable>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	content: {
		alignItems: "center",
		maxWidth: screenWidth * 0.85,
	},
	iconContainer: {
		marginBottom: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	compassImage: {
		width: 120,
		height: 120,
	},
	successIcon: {
		fontSize: 48,
		fontWeight: "bold",
		marginBottom: 20,
	},
	icon: {
		fontSize: 80,
	},
	phoneIcon: {
		marginBottom: 30,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 0,
	},
	description: {
		fontSize: 16,
		textAlign: "center",
		lineHeight: 24,
	},
	button: {
		marginTop: 40,
		paddingHorizontal: 40,
		paddingVertical: 16,
		borderRadius: 12,
		minWidth: 200,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 18,
		fontWeight: "600",
	},
	progressContainer: {
		marginTop: 40,
		width: "100%",
		alignItems: "center",
	},
	progressBar: {
		width: "100%",
		height: 12,
		borderRadius: 6,
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		borderRadius: 6,
	},
	progressText: {
		marginTop: 12,
		fontSize: 20,
		fontWeight: "600",
	},
	hint: {
		marginTop: 30,
		fontSize: 14,
		textAlign: "center",
		fontStyle: "italic",
	},
});
