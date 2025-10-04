#!/usr/bin/env node
import { Box, Text, useApp, useInput } from "ink";
import BigText from "ink-big-text";
import Gradient from "ink-gradient";
import SelectInput from "ink-select-input";
import React, { useState } from "react";
import { spawn } from "child_process";

interface MenuItem {
	label: string;
	value: string;
	command?: string;
}

const menuItems: MenuItem[] = [
	{ 
		label: "📱 Build iOS (Production)", 
		value: "build-ios-prod",
		command: "eas build --platform ios --profile production --non-interactive"
	},
	{ 
		label: "🧪 Build iOS (Preview/TestFlight)", 
		value: "build-ios-preview",
		command: "eas build --platform ios --profile preview --non-interactive"
	},
	{ 
		label: "🤖 Build Android (Production)", 
		value: "build-android-prod",
		command: "eas build --platform android --profile production --non-interactive"
	},
	{ 
		label: "🧪 Build Android (Preview)", 
		value: "build-android-preview",
		command: "eas build --platform android --profile preview --non-interactive"
	},
	{ label: "", value: "separator-1" },
	{ 
		label: "📸 Upload iOS Screenshots", 
		value: "upload-ios-screenshots",
		command: "fastlane ios upload_screenshots"
	},
	{ 
		label: "📸 Upload Android Screenshots", 
		value: "upload-android-screenshots",
		command: "export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && fastlane android upload_screenshots"
	},
	{ 
		label: "📝 Upload iOS Metadata", 
		value: "upload-ios-metadata",
		command: "fastlane ios upload_metadata"
	},
	{ 
		label: "📝 Upload Android Metadata", 
		value: "upload-android-metadata",
		command: "export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && fastlane android upload_metadata"
	},
	{ 
		label: "🚀 Upload iOS Screenshots + Metadata", 
		value: "upload-ios-all",
		command: "fastlane ios upload_all"
	},
	{ 
		label: "🚀 Upload Android Screenshots + Metadata", 
		value: "upload-android-all",
		command: "export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && fastlane android upload_all"
	},
	{ label: "", value: "separator-2" },
	{ 
		label: "📤 Submit iOS to App Store", 
		value: "submit-ios",
		command: "eas submit --platform ios --latest"
	},
	{ 
		label: "📤 Submit Android to Play Store", 
		value: "submit-android",
		command: "export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && eas submit --platform android --latest"
	},
	{ label: "", value: "separator-3" },
	{ 
		label: "🔍 Check Build Status", 
		value: "check-status",
		command: "eas build:list --limit 5"
	},
	{ 
		label: "📋 Verify Screenshots", 
		value: "verify-screenshots",
		command: "ls -la screenshots/ && ls -la store-metadata/"
	},
	{ label: "", value: "separator-4" },
	{ label: "❌ Exit", value: "exit" },
];

export default function DeployApp() {
	const { exit } = useApp();
	const [showMenu, setShowMenu] = useState(true);

	// Handle ESC key to return to menu
	useInput((input, key) => {
		if (key.escape) {
			setShowMenu(true);
		}
		if (input === 'q' && showMenu) {
			exit();
		}
	});

	const handleSelect = (item: MenuItem) => {
		if (item.value === "exit") {
			exit();
			return;
		}

		if (item.value.startsWith("separator")) {
			return;
		}

		if (!item.command) {
			return;
		}

		// Hide menu and show command info
		setShowMenu(false);
		
		// Clear screen and show command info
		console.clear();
		console.log("🚀 True Compass Deploy");
		console.log("=".repeat(50));
		console.log(`📋 Task: ${item.label}`);
		console.log(`💻 Command: ${item.command}`);
		console.log("=".repeat(50));
		console.log("");

		// Execute command in shell with full terminal control
		const child = spawn('sh', ['-c', item.command], {
			stdio: 'inherit',
			cwd: process.cwd()
		});

		child.on('close', (code) => {
			console.log("");
			console.log("=".repeat(50));
			if (code === 0) {
				console.log("✅ Command completed successfully!");
			} else {
				console.log(`❌ Command failed with exit code ${code}`);
			}
			console.log("Press any key to return to menu...");
			
			// Wait for any key press to return to menu
			process.stdin.setRawMode(true);
			process.stdin.resume();
			process.stdin.once('data', () => {
				process.stdin.setRawMode(false);
				process.stdin.pause();
				setShowMenu(true);
			});
		});

		child.on('error', (error) => {
			console.log("");
			console.log("=".repeat(50));
			console.log(`❌ Error: ${error.message}`);
			console.log("Press any key to return to menu...");
			
			process.stdin.setRawMode(true);
			process.stdin.resume();
			process.stdin.once('data', () => {
				process.stdin.setRawMode(false);
				process.stdin.pause();
				setShowMenu(true);
			});
		});
	};

	if (!showMenu) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="yellow">Command is running in terminal...</Text>
				<Text color="gray">Press ESC to return to menu</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Box justifyContent="center" marginBottom={1}>
				<Gradient name="rainbow">
					<BigText text="DEPLOY" font="block" />
				</Gradient>
			</Box>

			<Box justifyContent="center" marginBottom={2}>
				<Text bold color="cyan">
					True Compass Deployment Tool
				</Text>
			</Box>

			{/* Instructions */}
			<Box marginBottom={1}>
				<Text color="gray">
					Use ↑↓ arrows to navigate, Enter to select, Q to quit
				</Text>
			</Box>

			{/* Menu */}
			<SelectInput
				items={menuItems}
				onSelect={handleSelect}
				itemComponent={({ isSelected, label }) => (
					<Text color={isSelected ? "cyan" : "white"}>
						{isSelected ? "❯" : " "}
						{label}
					</Text>
				)}
			/>

			{/* Footer */}
			<Box marginTop={1}>
				<Text color="gray">Press ESC to return to menu from any screen</Text>
			</Box>
		</Box>
	);
}
