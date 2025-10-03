import { useThemeColor } from "@/hooks/use-theme-color";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";

interface SimulationControlsProps {
	onHeadingChange: (heading: number) => void;
	currentHeading: number;
	colorScheme?: "light" | "dark";
	onClose?: () => void;
}

export function SimulationControls({
	onHeadingChange,
	currentHeading,
	colorScheme = "dark",
	onClose,
}: SimulationControlsProps) {
	const isDark = colorScheme === "dark";
	const backgroundColor = isDark ? "#1a1a1a" : "#f5f5f5";
	const textColor = useThemeColor({}, "text");
	const tintColor = useThemeColor({}, "tint");
	const buttonBg = isDark ? "#2a2a2a" : "#e0e0e0";

	const presetHeadings = [
		{ label: "N", value: 0 },
		{ label: "NE", value: 45 },
		{ label: "E", value: 90 },
		{ label: "SE", value: 135 },
		{ label: "S", value: 180 },
		{ label: "SW", value: 225 },
		{ label: "W", value: 270 },
		{ label: "NW", value: 315 },
	];

	const handlePress = (heading: number) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onHeadingChange(heading);
	};

	return (
		<View style={[styles.container, { backgroundColor }]}>
			<View style={styles.header}>
				<View style={styles.headerText}>
					<ThemedText style={[styles.title, { color: textColor }]}>
						📸 Simulator Mode
					</ThemedText>
					<ThemedText
						style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}
					>
						Tap to set heading for screenshots
					</ThemedText>
				</View>
				{onClose && (
					<Pressable
						style={[styles.closeButton, { backgroundColor: buttonBg }]}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onClose();
						}}
					>
						<ThemedText style={[styles.closeButtonText, { color: textColor }]}>
							✕
						</ThemedText>
					</Pressable>
				)}
			</View>

			<View style={styles.buttonsContainer}>
				{presetHeadings.map(({ label, value }) => {
					const isActive = currentHeading === value;
					return (
						<Pressable
							key={label}
							style={[
								styles.button,
								{
									backgroundColor: isActive ? tintColor : buttonBg,
								},
							]}
							onPress={() => handlePress(value)}
						>
							<ThemedText
								style={[
									styles.buttonLabel,
									{
										color: isActive ? "#fff" : textColor,
										fontWeight: isActive ? "700" : "600",
									},
								]}
							>
								{label}
							</ThemedText>
							<ThemedText
								style={[
									styles.buttonValue,
									{
										color: isActive ? "#fff" : textColor,
										opacity: isActive ? 0.9 : 0.6,
									},
								]}
							>
								{value}°
							</ThemedText>
						</Pressable>
					);
				})}
			</View>

			<View style={styles.customContainer}>
				<ThemedText style={[styles.customLabel, { color: textColor }]}>
					Custom:
				</ThemedText>
				<View style={styles.customButtons}>
					<Pressable
						style={[styles.customButton, { backgroundColor: buttonBg }]}
						onPress={() => handlePress((currentHeading - 15 + 360) % 360)}
					>
						<ThemedText style={[styles.customButtonText, { color: textColor }]}>
							-15°
						</ThemedText>
					</Pressable>
					<Pressable
						style={[styles.customButton, { backgroundColor: buttonBg }]}
						onPress={() => handlePress((currentHeading - 5 + 360) % 360)}
					>
						<ThemedText style={[styles.customButtonText, { color: textColor }]}>
							-5°
						</ThemedText>
					</Pressable>
					<Pressable
						style={[styles.customButton, { backgroundColor: buttonBg }]}
						onPress={() => handlePress((currentHeading + 5) % 360)}
					>
						<ThemedText style={[styles.customButtonText, { color: textColor }]}>
							+5°
						</ThemedText>
					</Pressable>
					<Pressable
						style={[styles.customButton, { backgroundColor: buttonBg }]}
						onPress={() => handlePress((currentHeading + 15) % 360)}
					>
						<ThemedText style={[styles.customButtonText, { color: textColor }]}>
							+15°
						</ThemedText>
					</Pressable>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		padding: 20,
		paddingBottom: 40,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
	},
	header: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	headerText: {
		flex: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		textAlign: "center",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 13,
		textAlign: "center",
	},
	closeButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 12,
	},
	closeButtonText: {
		fontSize: 18,
		fontWeight: "600",
	},
	buttonsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		gap: 10,
		marginBottom: 16,
	},
	button: {
		width: 70,
		height: 60,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	buttonLabel: {
		fontSize: 18,
		marginBottom: 2,
	},
	buttonValue: {
		fontSize: 11,
	},
	customContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
	},
	customLabel: {
		fontSize: 14,
		fontWeight: "600",
	},
	customButtons: {
		flexDirection: "row",
		gap: 8,
	},
	customButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
	},
	customButtonText: {
		fontSize: 13,
		fontWeight: "600",
	},
});
