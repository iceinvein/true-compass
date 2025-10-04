import { type ExecException, exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface CommandResult {
	stdout: string;
	stderr: string;
	success: boolean;
	error?: Error;
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

// Upload commands
export const uploadScreenshots = () =>
	runCommand("fastlane ios upload_screenshots");
export const uploadMetadata = () => runCommand("fastlane ios upload_metadata");
export const uploadAll = () => runCommand("fastlane ios upload_all");

// Submit commands
export const submitIOS = () => runCommand("eas submit --platform ios --latest");
export const submitAndroid = () =>
	runCommand("eas submit --platform android --latest");

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
	results.push(await uploadScreenshots());
	if (!results[results.length - 1].success) return results;

	// Step 3: Upload metadata
	results.push(await uploadMetadata());
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
	results.push(await uploadMetadata());
	if (!results[results.length - 1].success) return results;

	// Step 3: Submit
	results.push(await submitAndroid());

	return results;
}
