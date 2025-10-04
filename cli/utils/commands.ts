import { type ExecException, exec, spawn } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface CommandResult {
	stdout: string;
	stderr: string;
	success: boolean;
	error?: Error;
}

export interface StreamingCommandOptions {
	onOutput?: (data: string, type: 'stdout' | 'stderr') => void;
	onComplete?: (result: CommandResult) => void;
	interactive?: boolean;
}

export async function runCommand(command: string): Promise<CommandResult> {
	try {
		const { stdout, stderr } = await execAsync(command, {
			cwd: process.cwd(),
			maxBuffer: 10 * 1024 * 1024, // 10MB buffer
		});

		return {
			stdout,
			stderr,
			success: true,
		};
	} catch (error) {
		// ExecException extends Error and includes stdout/stderr properties
		const execError = error as ExecException;
		return {
			stdout: execError.stdout || "",
			stderr: execError.stderr || "",
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

export function runCommandStreaming(
	command: string,
	options: StreamingCommandOptions = {}
): Promise<CommandResult> {
	return new Promise((resolve) => {
		// For interactive commands, we need to use inherit for all stdio
		// so the user can interact directly with the terminal
		const child = spawn('sh', ['-c', command], {
			cwd: process.cwd(),
			stdio: options.interactive ? 'inherit' : ['inherit', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';

		// Only capture output for non-interactive commands
		if (!options.interactive) {
			child.stdout?.on('data', (data) => {
				const text = data.toString();
				stdout += text;
				options.onOutput?.(text, 'stdout');
			});

			child.stderr?.on('data', (data) => {
				const text = data.toString();
				stderr += text;
				options.onOutput?.(text, 'stderr');
			});
		}

		child.on('close', (code) => {
			// Enhanced error message with more context
			let errorMessage = '';
			if (code !== 0) {
				errorMessage = `Command failed with exit code ${code}`;
				if (stderr) {
					errorMessage += `\nStderr: ${stderr}`;
				}
				if (stdout) {
					errorMessage += `\nStdout: ${stdout}`;
				}
				if (!stderr && !stdout) {
					errorMessage += '\nNo output captured. Command may have failed silently.';
				}
			}

			const result: CommandResult = {
				stdout,
				stderr,
				success: code === 0,
				error: code !== 0 ? new Error(errorMessage) : undefined,
			};

			options.onComplete?.(result);
			resolve(result);
		});

		child.on('error', (error) => {
			const result: CommandResult = {
				stdout,
				stderr: `${stderr}\nProcess error: ${error.message}`,
				success: false,
				error,
			};

			options.onComplete?.(result);
			resolve(result);
		});
	});
}

// Build commands
export const buildIOSProduction = () =>
	runCommand("eas build --platform ios --profile production --non-interactive");
export const buildIOSPreview = () =>
	runCommand("eas build --platform ios --profile preview --non-interactive");
export const buildAndroidProduction = () =>
	runCommand(
		"eas build --platform android --profile production --non-interactive",
	);
export const buildAndroidPreview = () =>
	runCommand(
		"eas build --platform android --profile preview --non-interactive",
	);

// Upload commands - iOS
export const uploadIOSScreenshots = () =>
	runCommand("fastlane ios upload_screenshots");
export const uploadIOSMetadata = () => runCommand("fastlane ios upload_metadata");
export const uploadIOSAll = () => runCommand("fastlane ios upload_all");

// Upload commands - Android (with service account setup)
export const uploadAndroidScreenshots = () =>
	runCommand("export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && fastlane android upload_screenshots");
export const uploadAndroidMetadata = () =>
	runCommand("export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && fastlane android upload_metadata");
export const uploadAndroidAll = () =>
	runCommand("export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && fastlane android upload_all");

// Legacy commands (for backward compatibility)
export const uploadScreenshots = () => uploadIOSScreenshots();
export const uploadMetadata = () => uploadIOSMetadata();
export const uploadAll = () => uploadIOSAll();

// Submit commands
export const submitIOS = () => runCommand("eas submit --platform ios --latest");
export const submitAndroid = () =>
	runCommand("export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && eas submit --platform android --latest");

// Streaming versions for commands that produce lots of output
export const submitIOSStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("eas submit --platform ios --latest", options);
export const submitAndroidStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && eas submit --platform android --latest", options);

export const buildIOSProductionStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("eas build --platform ios --profile production", options);
export const buildIOSPreviewStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("eas build --platform ios --profile preview", options);
export const buildAndroidProductionStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("eas build --platform android --profile production", options);
export const buildAndroidPreviewStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("eas build --platform android --profile preview", options);

// iOS streaming upload commands
export const uploadIOSScreenshotsStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("fastlane ios upload_screenshots", options);
export const uploadIOSMetadataStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("fastlane ios upload_metadata", options);
export const uploadIOSAllStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("fastlane ios upload_all", options);

// Android streaming upload commands (with service account setup)
export const uploadAndroidScreenshotsStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && fastlane android upload_screenshots", options);
export const uploadAndroidMetadataStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && fastlane android upload_metadata", options);
export const uploadAndroidAllStreaming = (options: StreamingCommandOptions) =>
	runCommandStreaming("export SUPPLY_JSON_KEY='./true-compass-474103-ab743809782a.json' && fastlane android upload_all", options);

// Legacy streaming commands (for backward compatibility)
export const uploadScreenshotsStreaming = (options: StreamingCommandOptions) =>
	uploadIOSScreenshotsStreaming(options);
export const uploadMetadataStreaming = (options: StreamingCommandOptions) =>
	uploadIOSMetadataStreaming(options);
export const uploadAllStreaming = (options: StreamingCommandOptions) =>
	uploadIOSAllStreaming(options);

// Status commands
export const checkBuildStatus = async (): Promise<CommandResult> => {
	// First check if EAS CLI is available
	const easCheck = await runCommand("eas --version");
	if (!easCheck.success) {
		return {
			stdout: "",
			stderr: "EAS CLI not found. Please install it with: npm install -g eas-cli",
			success: false,
			error: new Error("EAS CLI not installed"),
		};
	}

	// Then try to list builds
	const result = await runCommand("eas build:list --limit 5 --non-interactive");
	if (!result.success && result.stderr.includes("not logged in")) {
		return {
			stdout: "",
			stderr: "Not logged in to EAS. Please run: eas login",
			success: false,
			error: new Error("Not logged in to EAS"),
		};
	}

	return result;
};

// Verify commands
export async function verifyScreenshots(): Promise<CommandResult> {
	const commands = [
		'echo "📸 Screenshot Verification"',
		'echo "=========================="',
		'echo ""',
		'echo "📱 iPhone Screenshots:"',
		'ls -lh screenshots/en-US/*.jpeg 2>/dev/null | awk \'{print "  ✅", $9, "-", $5}\' || echo "  ⚠️  No iPhone screenshots found"',
		'echo ""',
		'echo "📱 iPad Screenshots:"',
		'ls -lh screenshots/en-US/*ipadPro129*.png 2>/dev/null | awk \'{print "  ✅", $9, "-", $5}\' || echo "  ⚠️  No iPad screenshots found"',
		'echo ""',
		'echo "🔍 Checking Dimensions:"',
		'echo ""',
		'echo "iPhone screenshots (should be 1290 x 2796):"',
		'file screenshots/en-US/*.jpeg 2>/dev/null | grep -o "[0-9]* x [0-9]*" || echo "  No iPhone screenshots"',
		'echo ""',
		'echo "iPad screenshots (should be 2048 x 2732):"',
		'file screenshots/en-US/*ipadPro129*.png 2>/dev/null | grep -o "[0-9]* x [0-9]*" || echo "  No iPad screenshots"',
	];

	return runCommand(commands.join(" && "));
}

// Full deployment workflows
export async function fullIOSDeploy(): Promise<CommandResult[]> {
	const results: CommandResult[] = [];

	// Step 1: Build
	results.push(await buildIOSProduction());
	if (!results[results.length - 1].success) return results;

	// Step 2: Upload screenshots
	results.push(await uploadIOSScreenshots());
	if (!results[results.length - 1].success) return results;

	// Step 3: Upload metadata
	results.push(await uploadIOSMetadata());
	if (!results[results.length - 1].success) return results;

	// Step 4: Submit
	results.push(await submitIOS());

	return results;
}

export async function fullAndroidDeploy(): Promise<CommandResult[]> {
	const results: CommandResult[] = [];

	// Step 1: Build
	results.push(await buildAndroidProduction());
	if (!results[results.length - 1].success) return results;

	// Step 2: Upload metadata
	results.push(await uploadAndroidMetadata());
	if (!results[results.length - 1].success) return results;

	// Step 3: Submit
	results.push(await submitAndroid());

	return results;
}
