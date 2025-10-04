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
	{ label: "📸 Upload iOS Screenshots", value: "upload-ios-screenshots" },
	{ label: "📸 Upload Android Screenshots", value: "upload-android-screenshots" },
	{ label: "📝 Upload iOS Metadata", value: "upload-ios-metadata" },
	{ label: "📝 Upload Android Metadata", value: "upload-android-metadata" },
	{ label: "🚀 Upload iOS Screenshots + Metadata", value: "upload-ios-all" },
	{ label: "🚀 Upload Android Screenshots + Metadata", value: "upload-android-all" },
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
	const [logs, setLogs] = useState<
		Array<{ text: string; type: "stdout" | "stderr" }>
	>([]);
	const [commandOutput, setCommandOutput] = useState<string>("");
	const [isInteractive, setIsInteractive] = useState<boolean>(false);

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
		setLogs([]);
		setCommandOutput("");

		const getStreamingOptions = (interactive = false): commands.StreamingCommandOptions => {
			if (interactive) {
				// For interactive commands, temporarily exit the UI
				setIsInteractive(true);
				// Show a brief message then clear the screen
				console.clear();
				console.log("🚀 True Compass Deploy - Interactive Command");
				console.log("=" .repeat(50));
				console.log("The command is running and may ask for input.");
				console.log("Please respond to any prompts below:");
				console.log("=" .repeat(50));
				console.log("");
			}

			return {
				interactive,
				onOutput: (data: string, type: "stdout" | "stderr") => {
					if (!interactive) {
						setLogs((prev) => [...prev, { text: data, type }]);
						setCommandOutput((prev) => prev + data);
					}
				},
				onComplete: (result: commands.CommandResult) => {
					if (interactive) {
						console.log("");
						console.log("=" .repeat(50));
						console.log(`Command completed: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
						if (!result.success) {
							console.log(`Error: ${result.error?.message || 'Unknown error'}`);
						}
						console.log("Returning to deploy menu...");
						console.log("=" .repeat(50));
						// Small delay to let user see the result
						setTimeout(() => {
							setIsInteractive(false);
							if (result.success) {
								setTaskStatus("success");
							} else {
								setTaskStatus("error");
								setErrorMessage(
									result.error?.message || result.stderr || "Command failed",
								);
							}
							setScreen("complete");
						}, 2000);
					} else {
						setIsInteractive(false);
						if (result.success) {
							setTaskStatus("success");
						} else {
							setTaskStatus("error");
							setErrorMessage(
								result.error?.message || result.stderr || "Command failed",
							);
						}
						setScreen("complete");
					}
				},
			};
		};

		try {
			// Execute the appropriate command with streaming
			switch (action) {
				case "build-ios-prod":
					await commands.buildIOSProductionStreaming(getStreamingOptions());
					break;
				case "build-ios-preview":
					await commands.buildIOSPreviewStreaming(getStreamingOptions());
					break;
				case "build-android-prod":
					await commands.buildAndroidProductionStreaming(getStreamingOptions());
					break;
				case "build-android-preview":
					await commands.buildAndroidPreviewStreaming(getStreamingOptions());
					break;
				case "upload-ios-screenshots":
					await commands.uploadIOSScreenshotsStreaming(getStreamingOptions(true)); // Interactive for file prompts
					break;
				case "upload-android-screenshots":
					await commands.uploadAndroidScreenshotsStreaming(getStreamingOptions()); // Non-interactive now that auth is handled
					break;
				case "upload-ios-metadata":
					await commands.uploadIOSMetadataStreaming(getStreamingOptions(true)); // Interactive for file prompts
					break;
				case "upload-android-metadata":
					await commands.uploadAndroidMetadataStreaming(getStreamingOptions()); // Non-interactive now that auth is handled
					break;
				case "upload-ios-all":
					await commands.uploadIOSAllStreaming(getStreamingOptions(true)); // Interactive for file prompts
					break;
				case "upload-android-all":
					await commands.uploadAndroidAllStreaming(getStreamingOptions()); // Non-interactive now that auth is handled
					break;
				case "submit-ios":
					await commands.submitIOSStreaming(getStreamingOptions());
					break;
				case "submit-android":
					await commands.submitAndroidStreaming(getStreamingOptions()); // Non-interactive now that auth is handled
					break;
				case "check-status": {
					// Use non-streaming for quick status checks
					const result = await commands.checkBuildStatus();
					setCommandOutput(result.stdout);
					if (!result.success) {
						throw result.error || new Error(result.stderr || "Command failed");
					}
					setTaskStatus("success");
					setScreen("complete");
					break;
				}
				case "verify-screenshots": {
					// Use non-streaming for verification
					const verifyResult = await commands.verifyScreenshots();
					setCommandOutput(verifyResult.stdout);
					if (!verifyResult.success) {
						throw (
							verifyResult.error ||
							new Error(verifyResult.stderr || "Command failed")
						);
					}
					setTaskStatus("success");
					setScreen("complete");
					break;
				}
				case "full-ios": {
					// Full iOS deployment workflow
					setLogs([{ text: "Starting full iOS deployment...\n", type: 'stdout' }]);

					// Step 1: Build
					setLogs(prev => [...prev, { text: "Step 1/4: Building iOS app...\n", type: 'stdout' }]);
					await commands.buildIOSProductionStreaming(getStreamingOptions());

					// Step 2: Upload screenshots
					setLogs(prev => [...prev, { text: "Step 2/4: Uploading iOS screenshots...\n", type: 'stdout' }]);
					await commands.uploadIOSScreenshotsStreaming(getStreamingOptions(true));

					// Step 3: Upload metadata
					setLogs(prev => [...prev, { text: "Step 3/4: Uploading iOS metadata...\n", type: 'stdout' }]);
					await commands.uploadIOSMetadataStreaming(getStreamingOptions(true));

					// Step 4: Submit
					setLogs(prev => [...prev, { text: "Step 4/4: Submitting to App Store...\n", type: 'stdout' }]);
					await commands.submitIOSStreaming(getStreamingOptions());
					break;
				}
				case "full-android": {
					// Full Android deployment workflow
					setLogs([{ text: "Starting full Android deployment...\n", type: 'stdout' }]);

					// Step 1: Build
					setLogs(prev => [...prev, { text: "Step 1/3: Building Android app...\n", type: 'stdout' }]);
					await commands.buildAndroidProductionStreaming(getStreamingOptions());

					// Step 2: Upload metadata
					setLogs(prev => [...prev, { text: "Step 2/3: Uploading Android metadata...\n", type: 'stdout' }]);
					await commands.uploadAndroidMetadataStreaming(getStreamingOptions());

					// Step 3: Submit
					setLogs(prev => [...prev, { text: "Step 3/3: Submitting to Play Store...\n", type: 'stdout' }]);
					await commands.submitAndroidStreaming(getStreamingOptions());
					break;
				}
				default:
					throw new Error(`Unknown action: ${action}`);
			}
		} catch (error) {
			setTaskStatus("error");
			setErrorMessage(error instanceof Error ? error.message : "Unknown error");
			setScreen("complete");
		}
	};

	const getTaskName = (action: string): string => {
		const taskNames: Record<string, string> = {
			"build-ios-prod": "Building iOS (Production)",
			"build-ios-preview": "Building iOS (Preview)",
			"build-android-prod": "Building Android (Production)",
			"build-android-preview": "Building Android (Preview)",
			"upload-ios-screenshots": "Uploading iOS Screenshots",
			"upload-android-screenshots": "Uploading Android Screenshots",
			"upload-ios-metadata": "Uploading iOS Metadata",
			"upload-android-metadata": "Uploading Android Metadata",
			"upload-ios-all": "Uploading iOS Screenshots + Metadata",
			"upload-android-all": "Uploading Android Screenshots + Metadata",
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
		// For interactive commands, show minimal UI since user needs to interact with terminal
		if (isInteractive) {
			return (
				<Box flexDirection="column" padding={1} justifyContent="center" alignItems="center">
					<Text bold color="cyan">
						Interactive Command Running
					</Text>
					<Text color="yellow">
						Please check your terminal for prompts
					</Text>
					<Text dimColor>
						Command will complete automatically when finished
					</Text>
				</Box>
			);
		}

		// For non-interactive commands, show full streaming UI
		return (
			<Box flexDirection="column" padding={1}>
				<Box marginBottom={1}>
					<Text bold color="cyan">
						{currentTask}
					</Text>
					<Text color="green"> <Spinner type="dots" /></Text>
				</Box>

				<Box marginBottom={1}>
					<Text dimColor>
						Press ESC to return to menu (command will continue in background)
					</Text>
				</Box>

				{/* Real-time command output */}
				<Box flexDirection="column" borderStyle="round" borderColor="gray" padding={1}>
					<Box marginBottom={1}>
						<Text bold color="yellow">Command Output:</Text>
					</Box>
					<Box flexDirection="column">
						{logs.slice(-15).map((log, index) => (
							<Text key={`${index}-${log.text.slice(0, 10)}`} color={log.type === 'stderr' ? 'red' : 'white'}>
								{log.text.trim()}
							</Text>
						))}
						{logs.length === 0 && (
							<Text dimColor>Waiting for command output...</Text>
						)}
					</Box>
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
