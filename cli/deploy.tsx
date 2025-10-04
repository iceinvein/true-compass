#!/usr/bin/env node
import { Box, Text, useApp, useInput } from "ink";
import BigText from "ink-big-text";
import Gradient from "ink-gradient";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import React, { useState } from "react";
import * as commands from "./utils/commands";

type Screen = "menu" | "running" | "complete";

interface MenuItem {
	label: string;
	value: string;
}

const menuItems: MenuItem[] = [
	{ label: "📱 Build iOS (Production)", value: "build-ios-prod" },
	{ label: "🧪 Build iOS (Preview/TestFlight)", value: "build-ios-preview" },
	{ label: "🤖 Build Android (Production)", value: "build-android-prod" },
	{ label: "🧪 Build Android (Preview)", value: "build-android-preview" },
	{ label: "", value: "separator-1" },
	{ label: "📸 Upload Screenshots Only", value: "upload-screenshots" },
	{ label: "📝 Upload Metadata Only", value: "upload-metadata" },
	{ label: "🚀 Upload Screenshots + Metadata", value: "upload-all" },
	{ label: "", value: "separator-2" },
	{ label: "📤 Submit iOS to App Store", value: "submit-ios" },
	{ label: "📤 Submit Android to Play Store", value: "submit-android" },
	{ label: "", value: "separator-3" },
	{ label: "🔄 Full iOS Deploy", value: "full-ios" },
	{ label: "🔄 Full Android Deploy", value: "full-android" },
	{ label: "", value: "separator-4" },
	{ label: "🔍 Check Build Status", value: "check-status" },
	{ label: "📋 Verify Screenshots", value: "verify-screenshots" },
	{ label: "", value: "separator-5" },
	{ label: "❌ Exit", value: "exit" },
];

export default function DeployApp() {
	const { exit } = useApp();
	const [screen, setScreen] = useState<Screen>("menu");
	const [currentTask, setCurrentTask] = useState<string>("");
	const [taskStatus, setTaskStatus] = useState<"running" | "success" | "error">(
		"running",
	);
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [commandOutput, setCommandOutput] = useState<string>("");

	useInput((input, key) => {
		if (input === "q" && screen === "menu") {
			exit();
		}
		if (key.escape && screen !== "menu") {
			setScreen("menu");
		}
	});

	const handleSelect = async (item: MenuItem) => {
		if (item.value.startsWith("separator")) {
			return;
		}

		if (item.value === "exit") {
			exit();
			return;
		}

		// Execute the selected action
		await executeAction(item.value);
	};

	const executeAction = async (action: string) => {
		setScreen("running");
		setCurrentTask(getTaskName(action));
		setTaskStatus("running");

		try {
			let result: commands.CommandResult | undefined;

			// Execute the appropriate command
			switch (action) {
				case "build-ios-prod":
					result = await commands.buildIOSProduction();
					break;
				case "build-ios-preview":
					result = await commands.buildIOSPreview();
					break;
				case "build-android-prod":
					result = await commands.buildAndroidProduction();
					break;
				case "build-android-preview":
					result = await commands.buildAndroidPreview();
					break;
				case "upload-screenshots":
					result = await commands.uploadScreenshots();
					break;
				case "upload-metadata":
					result = await commands.uploadMetadata();
					break;
				case "upload-all":
					result = await commands.uploadAll();
					break;
				case "submit-ios":
					result = await commands.submitIOS();
					break;
				case "submit-android":
					result = await commands.submitAndroid();
					break;
				case "check-status":
					result = await commands.checkBuildStatus();
					break;
				case "verify-screenshots":
					result = await commands.verifyScreenshots();
					break;
				default:
					throw new Error(`Unknown action: ${action}`);
			}

			if (result && !result.success) {
				throw result.error || new Error(result.stderr || "Command failed");
			}

			setTaskStatus("success");
			setCommandOutput(result?.stdout || "Command completed successfully");
			setScreen("complete");

			// Don't automatically return to menu - let user decide
		} catch (error) {
			setTaskStatus("error");
			setErrorMessage(error instanceof Error ? error.message : "Unknown error");
			setScreen("complete");

			// Don't automatically return to menu on error - let user decide
		}
	};

	const getTaskName = (action: string): string => {
		const taskNames: Record<string, string> = {
			"build-ios-prod": "Building iOS (Production)",
			"build-ios-preview": "Building iOS (Preview)",
			"build-android-prod": "Building Android (Production)",
			"build-android-preview": "Building Android (Preview)",
			"upload-screenshots": "Uploading Screenshots",
			"upload-metadata": "Uploading Metadata",
			"upload-all": "Uploading Screenshots + Metadata",
			"submit-ios": "Submitting iOS to App Store",
			"submit-android": "Submitting Android to Play Store",
			"full-ios": "Full iOS Deployment",
			"full-android": "Full Android Deployment",
			"check-status": "Checking Build Status",
			"verify-screenshots": "Verifying Screenshots",
		};
		return taskNames[action] || action;
	};

	if (screen === "menu") {
		return (
			<Box flexDirection="column" padding={1}>
				<Box marginBottom={1}>
					<Gradient name="rainbow">
						<BigText text="Deploy" font="tiny" />
					</Gradient>
				</Box>

				<Box marginBottom={1}>
					<Text bold color="cyan">
						True Compass Deployment Tool
					</Text>
				</Box>

				<Box marginBottom={1}>
					<Text dimColor>
						Use ↑↓ arrows to navigate, Enter to select, Q to quit
					</Text>
				</Box>

				<SelectInput
					items={menuItems.filter(
						(item) => !item.value.startsWith("separator"),
					)}
					onSelect={handleSelect}
					indicatorComponent={({ isSelected }) => (
						<Text color={isSelected ? "cyan" : "gray"}>
							{isSelected ? "❯" : " "}
						</Text>
					)}
					itemComponent={({ isSelected, label }) => (
						<Text color={isSelected ? "cyan" : "white"} bold={isSelected}>
							{label}
						</Text>
					)}
				/>

				<Box marginTop={1}>
					<Text dimColor>Press ESC to return to menu from any screen</Text>
				</Box>
			</Box>
		);
	}

	if (screen === "running") {
		return (
			<Box flexDirection="column" padding={1}>
				<Box marginBottom={1}>
					<Text bold color="cyan">
						{currentTask}
					</Text>
				</Box>

				<Box>
					<Text color="green">
						<Spinner type="dots" />
					</Text>
					<Text> Processing...</Text>
				</Box>

				<Box marginTop={1}>
					<Text dimColor>This may take a few minutes...</Text>
				</Box>

				<Box marginTop={1}>
					<Text dimColor>
						Press ESC to return to menu (command will continue in background)
					</Text>
				</Box>
			</Box>
		);
	}

	if (screen === "complete") {
		return (
			<Box flexDirection="column" padding={1}>
				<Box marginBottom={1}>
					<Text bold color={taskStatus === "success" ? "green" : "red"}>
						{taskStatus === "success" ? "✅ Success!" : "❌ Error"}
					</Text>
				</Box>

				<Box marginBottom={1}>
					<Text>
						{taskStatus === "success"
							? `${currentTask} completed successfully!`
							: `${currentTask} failed: ${errorMessage}`}
					</Text>
				</Box>

				{taskStatus === "success" && commandOutput && (
					<Box marginBottom={1} flexDirection="column">
						<Text bold>Output:</Text>
						<Box borderStyle="round" paddingX={1} paddingY={0}>
							<Text>{commandOutput}</Text>
						</Box>
					</Box>
				)}

				<Box marginTop={1}>
					<Text dimColor>Press ESC to return to menu</Text>
				</Box>
			</Box>
		);
	}

	return null;
}
