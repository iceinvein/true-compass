import { useCompass } from "@/hooks/use-compass";
import { useThemeColor } from "@/hooks/use-theme-color";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Alert, Dimensions, Pressable, StyleSheet, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { CompassError } from "./compass-error";
import { LoadingCompass } from "./loading-compass";
import { ThemedText } from "./themed-text";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const COMPASS_SIZE = Math.min(screenWidth, screenHeight) * 0.85;

interface CompassProps {
	axisFlipEW?: boolean;
	colorScheme?: "light" | "dark";
	onToggleTheme?: () => void;
}

export function Compass({
	axisFlipEW = false,
	colorScheme = "dark",
	onToggleTheme,
}: CompassProps) {
	const { data, isLoading, error } = useCompass({
		axisFlipEW,
		useCrossProduct: true,
	});
	const rotation = useSharedValue(0);
	const [showLowAccuracyHint, setShowLowAccuracyHint] = useState(false);
	const [tapCount, setTapCount] = useState(0);
	const [tapTimeout, setTapTimeout] = useState<ReturnType<
		typeof setTimeout
	> | null>(null);

	const tintColor = useThemeColor({}, "tint");

	// Triple-tap handler for dev settings
	const handleHeadingPress = () => {
		const newCount = tapCount + 1;
		setTapCount(newCount);

		// Clear existing timeout
		if (tapTimeout) {
			clearTimeout(tapTimeout);
		}

		// Reset count after 1 second
		const timeout = setTimeout(() => {
			setTapCount(0);
		}, 1000);
		setTapTimeout(timeout);

		// Triple tap detected
		if (newCount === 3) {
			setTapCount(0);
			if (tapTimeout) clearTimeout(tapTimeout);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

			Alert.alert("Developer Settings", "Reset onboarding and restart app?", [
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Reset",
					style: "destructive",
					onPress: async () => {
						await AsyncStorage.multiRemove([
							"@true_compass_setup_complete",
							"@true_compass_axis_flip",
						]);
						Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
						Alert.alert(
							"Reset Complete",
							"Please close and reopen the app to see the onboarding flow.",
							[{ text: "OK" }],
						);
					},
				},
			]);
		}
	};
	const isDark = colorScheme === "dark";
	const backgroundColor = isDark ? "#000000" : "#FFFFFF";
	const textColor = isDark ? "#FFFFFF" : "#000000";
	const headingColor = isDark ? tintColor : "#1a73e8"; // Use blue in light mode for better contrast
	const secondaryColor = isDark
		? "rgba(255, 255, 255, 0.4)"
		: "rgba(0, 0, 0, 0.4)";
	const hintBgColor = isDark
		? "rgba(255, 167, 38, 0.15)"
		: "rgba(255, 167, 38, 0.25)";
	const hintBorderColor = isDark
		? "rgba(255, 167, 38, 0.3)"
		: "rgba(255, 167, 38, 0.5)";
	const hintTextColor = isDark ? "#FFA726" : "#F57C00";

	// Show subtle hint when accuracy is low (no auto-popup modal)
	useEffect(() => {
		if (!data) return;
		// Show hint if accuracy is consistently low
		if (data.accuracy < 40) {
			setShowLowAccuracyHint(true);
		} else if (data.accuracy > 60) {
			setShowLowAccuracyHint(false);
		}
	}, [data]);

	useEffect(() => {
		if (data?.rotationDeg !== undefined) {
			rotation.value = withSpring(-data.rotationDeg, {
				damping: 26,
				stiffness: 110,
				mass: 1,
				overshootClamping: true,
			});
		}
	}, [data?.rotationDeg, rotation]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (tapTimeout) {
				clearTimeout(tapTimeout);
			}
		};
	}, [tapTimeout]);

	const compassStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	if (isLoading) return <LoadingCompass size={COMPASS_SIZE} />;
	if (error) return <CompassError size={COMPASS_SIZE} error={error} />;

	return (
		<View style={[styles.container, { backgroundColor }]}>
			{/* Theme toggle button */}
			{onToggleTheme && (
				<Pressable
					style={styles.themeToggle}
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onToggleTheme();
					}}
				>
					<ThemedText style={[styles.themeToggleText, { color: textColor }]}>
						{isDark ? "☀️" : "🌙"}
					</ThemedText>
				</Pressable>
			)}

			{/* Digital heading display - Triple tap to reset onboarding */}
			<Pressable style={styles.digitalDisplay} onPress={handleHeadingPress}>
				<ThemedText style={[styles.headingText, { color: headingColor }]}>
					{Math.round(data?.heading ?? 0)}°
				</ThemedText>
				<ThemedText style={[styles.directionText, { color: textColor }]}>
					{data?.cardinalDirection}
				</ThemedText>
			</Pressable>

			{/* Level bubble indicator */}
			{data && (
				<View style={styles.levelRow}>
					<View style={[styles.levelBubble, { borderColor: secondaryColor }]}>
						{(() => {
							const roll = data.rollDeg ?? 0;
							const pitch = data.pitchDeg ?? 0;
							const maxTilt = 30; // deg before saturating at edge
							const radius = 28; // bubble inner radius (levelBubble size 64 -> padding)
							const clamp = (v: number, min: number, max: number) =>
								Math.max(min, Math.min(max, v));
							const tx = clamp((pitch / maxTilt) * radius, -radius, radius);
							const ty = clamp((-roll / maxTilt) * radius, -radius, radius);
							const dotColor = (data.isLevel ?? false) ? "#4CAF50" : "#FF9800";
							return (
								<View
									style={[
										styles.levelDot,
										{
											backgroundColor: dotColor,
											transform: [{ translateX: tx }, { translateY: ty }],
										},
									]}
								/>
							);
						})()}
					</View>
					<ThemedText style={[styles.levelText, { color: secondaryColor }]}>
						{data.tiltDeg != null
							? `Tilt ${Math.round(data.tiltDeg)}°`
							: "Level"}
					</ThemedText>
				</View>
			)}

			{/* Low accuracy hint banner */}
			{showLowAccuracyHint && (
				<View
					style={[
						styles.hintBanner,
						{
							backgroundColor: hintBgColor,
							borderColor: hintBorderColor,
						},
					]}
				>
					<ThemedText style={[styles.hintText, { color: hintTextColor }]}>
						⚠️ Move away from metal objects
					</ThemedText>
				</View>
			)}

			{/* Compass container */}
			<View
				style={[
					styles.compassContainer,
					{ width: COMPASS_SIZE, height: COMPASS_SIZE },
				]}
			>
				{/* Outer ring */}
				<View
					style={[
						styles.outerRing,
						{
							width: COMPASS_SIZE,
							height: COMPASS_SIZE,
							borderColor: secondaryColor,
						},
					]}
				/>

				{/* Rotating compass face */}
				<Animated.View style={[styles.compassFace, compassStyle]}>
					{/* Degree markings */}
					{Array.from({ length: 72 }, (_, i) => {
						const angle = i * 5;
						const isMainMark = angle % 30 === 0;
						const isCardinal = angle % 90 === 0;

						if (isCardinal) return null; // Skip cardinals, we'll draw them separately

						const markHeight = isMainMark ? 16 : 8;
						const markWidth = isMainMark ? 2 : 1;

						return (
							<View
								key={`mark-${angle}`}
								style={[
									styles.degreeMark,
									{
										transform: [{ rotate: `${angle}deg` }],
									},
								]}
							>
								<View
									style={{
										width: markWidth,
										height: markHeight,
										backgroundColor: secondaryColor,
										position: "absolute",
										top: 0,
										borderRadius: 1,
									}}
								/>
							</View>
						);
					})}

					{/* Cardinal directions */}
					{[
						{ label: "N", angle: 0, color: headingColor },
						{ label: "E", angle: 90, color: textColor },
						{ label: "S", angle: 180, color: textColor },
						{ label: "W", angle: 270, color: textColor },
					].map(({ label, angle, color }) => (
						<View
							key={label}
							style={[
								styles.cardinalContainer,
								{
									transform: [{ rotate: `${angle}deg` }],
								},
							]}
						>
							<View style={styles.cardinalMark}>
								<View
									style={{
										width: 3,
										height: 20,
										backgroundColor: color,
										borderRadius: 1.5,
									}}
								/>
								<View
									style={[
										styles.cardinalLabelContainer,
										{
											transform: [{ rotate: `${-angle}deg` }],
										},
									]}
								>
									<ThemedText style={[styles.cardinalLabel, { color }]}>
										{label}
									</ThemedText>
								</View>
							</View>
						</View>
					))}

					{/* Center dot */}
					<View style={[styles.centerDot, { backgroundColor: textColor }]} />
				</Animated.View>

				{/* Fixed north indicator (red triangle at top) */}
				<View
					style={[styles.northIndicator, { borderBottomColor: headingColor }]}
				/>
			</View>

			{/* Accuracy indicator - removed, handled by hint banner instead */}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 40,
	},
	digitalDisplay: {
		alignItems: "center",
		marginBottom: 24,
		paddingHorizontal: 16,
		zIndex: 10,
	},
	headingText: {
		fontSize: 64,
		lineHeight: 68,
		fontWeight: "bold",
		fontVariant: ["tabular-nums"],
		letterSpacing: 0,
		textAlign: "center",
	},
	directionText: {
		fontSize: 24,
		fontWeight: "600",
		marginTop: -4,
		letterSpacing: 1,
		textAlign: "center",
	},
	compassContainer: {
		position: "relative",
		alignItems: "center",
		justifyContent: "center",
	},
	outerRing: {
		position: "absolute",
		borderRadius: 10000,
		borderWidth: 2,
	},
	compassFace: {
		position: "absolute",
		width: "100%",
		height: "100%",
		alignItems: "center",
		justifyContent: "center",
	},
	degreeMark: {
		position: "absolute",
		width: "100%",
		height: "100%",
		alignItems: "center",
	},
	cardinalContainer: {
		position: "absolute",
		width: "100%",
		height: "100%",
		alignItems: "center",
	},
	cardinalMark: {
		alignItems: "center",
	},
	cardinalLabelContainer: {
		marginTop: 8,
	},
	cardinalLabel: {
		fontSize: 24,
		fontWeight: "bold",
		letterSpacing: 1,
	},
	centerDot: {
		width: 16,
		height: 16,
		borderRadius: 8,
		position: "absolute",
	},
	northIndicator: {
		position: "absolute",
		top: 8,
		width: 0,
		height: 0,
		borderLeftWidth: 12,
		borderRightWidth: 12,
		borderBottomWidth: 16,
		borderLeftColor: "transparent",
		borderRightColor: "transparent",
		zIndex: 10,
	},
	levelRow: {
		marginBottom: 20,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	levelBubble: {
		width: 64,
		height: 64,
		borderRadius: 32,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
	},
	levelDot: {
		position: "absolute",
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	levelText: {
		fontSize: 14,
		letterSpacing: 0.5,
	},
	hintBanner: {
		position: "absolute",
		bottom: 80,
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 8,
		borderWidth: 1,
		zIndex: 5,
	},
	hintText: {
		fontSize: 14,
		fontWeight: "500",
	},
	themeToggle: {
		position: "absolute",
		top: 50,
		right: 20,
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(128, 128, 128, 0.2)",
		zIndex: 100,
	},
	themeToggleText: {
		fontSize: 24,
	},
});
