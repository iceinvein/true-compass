import { Compass } from "@/components/compass";
import { SetupScreen } from "@/components/setup-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useKeepAwake } from "expo-keep-awake";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    useColorScheme as useSystemColorScheme,
    View,
} from "react-native";

const SETUP_COMPLETE_KEY = "@true_compass_setup_complete";
const AXIS_FLIP_KEY = "@true_compass_axis_flip";
const THEME_KEY = "@true_compass_theme";

export default function CompassScreen() {
	// Keep screen awake while using compass
	useKeepAwake();

	const systemColorScheme = useSystemColorScheme();
	const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
	const [axisFlip, setAxisFlip] = useState<boolean>(false);
	const [colorScheme, setColorScheme] = useState<"light" | "dark" | null>(null);

	// Detect if running in iOS Simulator (not Expo Go on real device)
	// Constants.isDevice is false for both simulator AND Expo Go
	// Check executionEnvironment: 'standalone' = production app, 'storeClient' = Expo Go
	const isSimulator =
		!Constants.isDevice && Constants.executionEnvironment === "standalone";

	useEffect(() => {
		// In simulator mode, skip setup automatically
		if (isSimulator) {
			setSetupComplete(true);
			setAxisFlip(true); // Default to true for cross-product fusion
			setColorScheme(systemColorScheme || "dark");
			return;
		}

		// Check if setup was already completed and load theme preference
		AsyncStorage.multiGet([SETUP_COMPLETE_KEY, AXIS_FLIP_KEY, THEME_KEY]).then(
			async (values) => {
				const setupDone = values[0][1] === "true";
				let flip = values[1][1] === "true";
				const savedTheme = values[2][1] as "light" | "dark" | null;

				// Migration: cross-product fusion requires flip=true by default
				// If setup was done with old method (flip=false), update it
				if (setupDone && !flip) {
					flip = true;
					await AsyncStorage.setItem(AXIS_FLIP_KEY, "true");
				}

				setSetupComplete(setupDone);
				setAxisFlip(flip);
				setColorScheme(savedTheme || systemColorScheme || "dark");
			},
		);
	}, [systemColorScheme, isSimulator]);

	const handleSetupComplete = async (detectedFlip: boolean) => {
		await AsyncStorage.multiSet([
			[SETUP_COMPLETE_KEY, "true"],
			[AXIS_FLIP_KEY, detectedFlip ? "true" : "false"],
		]);
		setAxisFlip(detectedFlip);
		setSetupComplete(true);
	};

	const handleToggleTheme = async () => {
		const newTheme = colorScheme === "dark" ? "light" : "dark";
		setColorScheme(newTheme);
		await AsyncStorage.setItem(THEME_KEY, newTheme);
	};

	// Show loading state while checking setup status
	if (setupComplete === null || colorScheme === null) {
		return <View style={styles.container} />;
	}

	const backgroundColor = colorScheme === "dark" ? "#000" : "#FFF";

	return (
		<View style={[styles.container, { backgroundColor }]}>
			{!setupComplete ? (
				<SetupScreen
					onComplete={handleSetupComplete}
					colorScheme={colorScheme}
				/>
			) : (
				<Compass
					axisFlipEW={axisFlip}
					colorScheme={colorScheme}
					onToggleTheme={handleToggleTheme}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
