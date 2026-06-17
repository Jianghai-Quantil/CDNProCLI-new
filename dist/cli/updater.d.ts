/**
 * updater.ts — version check, install-scope detection, and update execution.
 *
 * Used by two consumers:
 *   1. `cdnpro update`          — explicit command (commands/update.ts)
 *   2. startup notifier         — passive background check in main.ts
 */
export type InstallScope = 'global' | 'local' | 'npx';
export interface InstallInfo {
    scope: InstallScope;
    /** Absolute path to the project root (local scope only). */
    projectRoot?: string;
    /** Package manager detected at the project root (local scope only). */
    packageManager?: 'npm' | 'yarn' | 'pnpm';
}
export interface VersionCheckResult {
    current: string;
    latest: string;
    updateAvailable: boolean;
}
declare const CURRENT_VERSION: string;
export { CURRENT_VERSION };
/** Fetch the latest published version from the npm registry (no external deps). */
export declare function fetchLatestVersion(): Promise<string>;
/** Returns true when `candidate` is strictly greater than `current`. */
export declare function isNewer(current: string, candidate: string): boolean;
/**
 * Determines how the CLI was installed:
 *   - 'global'  — binary lives under the global npm prefix
 *   - 'local'   — binary lives inside a project's node_modules
 *   - 'npx'     — invoked via npx (no persistent install to update)
 */
export declare function detectInstallInfo(): InstallInfo;
export interface UpdateCommand {
    /** The executable to run, e.g. 'npm', 'yarn', 'pnpm'. */
    bin: string;
    /** Arguments to pass. */
    args: string[];
    /** Working directory (only set for local scope). */
    cwd?: string;
    /** Human-readable description of what will run. */
    description: string;
}
export declare function buildUpdateCommand(info: InstallInfo): UpdateCommand | null;
/** Spawn the update command and pipe stdio to the terminal. Returns exit code. */
export declare function runUpdateCommand(cmd: UpdateCommand): Promise<number>;
export declare function scheduleUpdateCheck(): void;
/**
 * Print a one-line upgrade notice to stderr if a newer version was found.
 * Call this at the very end of a successful command execution.
 */
export declare function printUpdateNotice(): void;
//# sourceMappingURL=updater.d.ts.map