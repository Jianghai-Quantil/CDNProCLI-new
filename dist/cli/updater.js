"use strict";
/**
 * updater.ts — version check, install-scope detection, and update execution.
 *
 * Used by two consumers:
 *   1. `cdnpro update`          — explicit command (commands/update.ts)
 *   2. startup notifier         — passive background check in main.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENT_VERSION = void 0;
exports.fetchLatestVersion = fetchLatestVersion;
exports.isNewer = isNewer;
exports.detectInstallInfo = detectInstallInfo;
exports.buildUpdateCommand = buildUpdateCommand;
exports.runUpdateCommand = runUpdateCommand;
exports.scheduleUpdateCheck = scheduleUpdateCheck;
exports.printUpdateNotice = printUpdateNotice;
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const conf_1 = __importDefault(require("conf"));
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PACKAGE_NAME = 'cdnpro-cli';
// Resolve the current version from the nearest package.json at build time.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CURRENT_VERSION = (() => {
    try {
        // __dirname resolves to dist/cli at runtime; walk up to find package.json
        let dir = __dirname;
        for (let i = 0; i < 5; i++) {
            const candidate = path.join(dir, 'package.json');
            if (fs.existsSync(candidate)) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                return require(candidate).version ?? '0.0.0';
            }
            dir = path.dirname(dir);
        }
        return '0.0.0';
    }
    catch {
        return '0.0.0';
    }
})();
exports.CURRENT_VERSION = CURRENT_VERSION;
// Cache: check at most once per 24 hours per install.
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const notifierStore = new conf_1.default({
    projectName: 'cdnpro',
    configName: 'update-notifier',
    defaults: {
        lastCheckTime: 0,
        latestKnownVersion: '',
    },
});
// ---------------------------------------------------------------------------
// Registry fetch
// ---------------------------------------------------------------------------
/** Fetch the latest published version from the npm registry (no external deps). */
function fetchLatestVersion() {
    return new Promise((resolve, reject) => {
        const url = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
        const req = https.get(url, { headers: { Accept: 'application/json' } }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Registry responded with HTTP ${res.statusCode}`));
                res.resume();
                return;
            }
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    const version = parsed.version;
                    if (!version) {
                        reject(new Error('Could not parse version from registry response'));
                    }
                    else {
                        resolve(version);
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(8000, () => {
            req.destroy(new Error('Registry request timed out'));
        });
    });
}
// ---------------------------------------------------------------------------
// Version comparison (semver — no dependency)
// ---------------------------------------------------------------------------
/** Returns true when `candidate` is strictly greater than `current`. */
function isNewer(current, candidate) {
    const parse = (v) => v.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
    const [cMaj, cMin, cPat] = parse(current);
    const [lMaj, lMin, lPat] = parse(candidate);
    if (lMaj !== cMaj)
        return lMaj > cMaj;
    if (lMin !== cMin)
        return lMin > cMin;
    return lPat > cPat;
}
// ---------------------------------------------------------------------------
// Install-scope detection
// ---------------------------------------------------------------------------
/**
 * Determines how the CLI was installed:
 *   - 'global'  — binary lives under the global npm prefix
 *   - 'local'   — binary lives inside a project's node_modules
 *   - 'npx'     — invoked via npx (no persistent install to update)
 */
function detectInstallInfo() {
    // npx sets npm_lifecycle_script or runs from a temp cache directory.
    // The most reliable signal is the presence of npm_execpath combined with
    // the script path containing '_npx' or 'npx-cache'.
    const scriptPath = process.argv[1] ?? '';
    if (scriptPath.includes('_npx') || scriptPath.includes('npx-cache')) {
        return { scope: 'npx' };
    }
    // Attempt to resolve the global npm root and compare against the script path.
    try {
        const globalRoot = (0, child_process_1.execSync)('npm root -g', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        if (scriptPath.startsWith(globalRoot)) {
            return { scope: 'global' };
        }
    }
    catch {
        // npm not on PATH or failed — fall through to local detection
    }
    // Local install: walk upward from cwd to find the nearest package.json
    // that lists this package as a dependency.
    const projectRoot = findProjectRoot(process.cwd());
    if (projectRoot) {
        return {
            scope: 'local',
            projectRoot,
            packageManager: detectPackageManager(projectRoot),
        };
    }
    // Fallback — treat as global
    return { scope: 'global' };
}
/** Walk up the directory tree to find a package.json that depends on PACKAGE_NAME. */
function findProjectRoot(startDir) {
    let dir = startDir;
    for (;;) {
        const candidate = path.join(dir, 'package.json');
        if (fs.existsSync(candidate)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8'));
                if (pkg.dependencies?.[PACKAGE_NAME] !== undefined ||
                    pkg.devDependencies?.[PACKAGE_NAME] !== undefined) {
                    return dir;
                }
            }
            catch {
                // malformed package.json — skip
            }
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            return null; // reached filesystem root
        dir = parent;
    }
}
/** Detect package manager from lock file presence. */
function detectPackageManager(dir) {
    if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml')))
        return 'pnpm';
    if (fs.existsSync(path.join(dir, 'yarn.lock')))
        return 'yarn';
    return 'npm';
}
function buildUpdateCommand(info) {
    switch (info.scope) {
        case 'npx':
            return null; // nothing to update
        case 'global': {
            // For global scope we always use npm — detecting which pm installed it
            // globally is unreliable and risky.
            return {
                bin: 'npm',
                args: ['install', '-g', `${PACKAGE_NAME}@latest`],
                description: `npm install -g ${PACKAGE_NAME}@latest`,
            };
        }
        case 'local': {
            const pm = info.packageManager ?? 'npm';
            switch (pm) {
                case 'yarn':
                    return {
                        bin: 'yarn',
                        args: ['add', `${PACKAGE_NAME}@latest`],
                        cwd: info.projectRoot,
                        description: `yarn add ${PACKAGE_NAME}@latest  (in ${info.projectRoot})`,
                    };
                case 'pnpm':
                    return {
                        bin: 'pnpm',
                        args: ['add', `${PACKAGE_NAME}@latest`],
                        cwd: info.projectRoot,
                        description: `pnpm add ${PACKAGE_NAME}@latest  (in ${info.projectRoot})`,
                    };
                default:
                    return {
                        bin: 'npm',
                        args: ['install', `${PACKAGE_NAME}@latest`],
                        cwd: info.projectRoot,
                        description: `npm install ${PACKAGE_NAME}@latest  (in ${info.projectRoot})`,
                    };
            }
        }
    }
}
// ---------------------------------------------------------------------------
// Run the update
// ---------------------------------------------------------------------------
/** Spawn the update command and pipe stdio to the terminal. Returns exit code. */
function runUpdateCommand(cmd) {
    return new Promise((resolve) => {
        const child = (0, child_process_1.spawn)(cmd.bin, cmd.args, {
            cwd: cmd.cwd,
            stdio: 'inherit',
            shell: process.platform === 'win32', // required for .cmd shims on Windows
        });
        child.on('close', (code) => resolve(code ?? 1));
        child.on('error', (err) => {
            process.stderr.write(`Failed to run update command: ${err.message}\n`);
            resolve(1);
        });
    });
}
// ---------------------------------------------------------------------------
// Startup notifier (passive, background)
// ---------------------------------------------------------------------------
/**
 * Check the registry at most once per CHECK_INTERVAL_MS.
 * If a newer version is available, stash it so `printUpdateNotice` can
 * display it after the main command finishes.
 *
 * This function fires-and-forgets; it must not block the main command.
 * The promise is intentionally not awaited by the caller.
 */
let _pendingLatest = null;
function scheduleUpdateCheck() {
    // Only run in interactive sessions — not in piped / agent mode.
    if (!process.stdout.isTTY)
        return;
    const now = Date.now();
    const lastCheck = notifierStore.get('lastCheckTime') ?? 0;
    if (now - lastCheck < CHECK_INTERVAL_MS) {
        // Use the cached value from the last successful check
        const cached = notifierStore.get('latestKnownVersion') ?? '';
        if (cached && isNewer(CURRENT_VERSION, cached)) {
            _pendingLatest = cached;
        }
        return;
    }
    // Kick off a background fetch — do not await
    fetchLatestVersion()
        .then((latest) => {
        notifierStore.set('lastCheckTime', now);
        notifierStore.set('latestKnownVersion', latest);
        if (isNewer(CURRENT_VERSION, latest)) {
            _pendingLatest = latest;
        }
    })
        .catch(() => {
        // Network failure — silently ignore; do not disrupt the command.
    });
}
/**
 * Print a one-line upgrade notice to stderr if a newer version was found.
 * Call this at the very end of a successful command execution.
 */
function printUpdateNotice() {
    if (!_pendingLatest)
        return;
    process.stderr.write(`\nNotice: ${PACKAGE_NAME} ${_pendingLatest} is available (you have ${CURRENT_VERSION}). ` +
        `Run \`cdnpro update\` to upgrade.\n`);
}
//# sourceMappingURL=updater.js.map