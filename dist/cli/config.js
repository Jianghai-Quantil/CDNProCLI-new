"use strict";
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
exports.resolveCredentials = resolveCredentials;
exports.getProfile = getProfile;
exports.saveProfile = saveProfile;
exports.deleteProfile = deleteProfile;
exports.listProfiles = listProfiles;
exports.getDefaultProfile = getDefaultProfile;
exports.setDefaultProfile = setDefaultProfile;
exports.promptInput = promptInput;
const conf_1 = __importDefault(require("conf"));
const readline = __importStar(require("readline"));
const errors_1 = require("./errors");
const keychain_1 = require("./keychain");
// conf@9 stores data at ~/.config/cdnpro/config.json (Linux/macOS)
// or %APPDATA%\cdnpro\config.json (Windows).
const store = new conf_1.default({
    projectName: 'cdnpro',
    defaults: {
        defaultProfile: 'default',
        profiles: {},
    },
});
async function resolveCredentials(globalOpts) {
    // 1. Explicit CLI flags (all three required together)
    if (globalOpts.host && globalOpts.user && globalOpts.secretKey) {
        return {
            host: globalOpts.host,
            user: globalOpts.user,
            secretKey: globalOpts.secretKey,
        };
    }
    // 2. Environment variables (all three required together)
    if (process.env['CDNPRO_HOST'] && process.env['CDNPRO_USER'] && process.env['CDNPRO_SECRETKEY']) {
        return {
            host: process.env['CDNPRO_HOST'],
            user: process.env['CDNPRO_USER'],
            secretKey: process.env['CDNPRO_SECRETKEY'],
        };
    }
    // 3. Profile: CLI flag > env var > stored default
    const profileName = globalOpts.profile ??
        process.env['CDNPRO_PROFILE'] ??
        store.get('defaultProfile');
    const profiles = store.get('profiles') ?? {};
    const profile = profiles[profileName];
    if (profile) {
        const secretKey = (await (0, keychain_1.getSecret)(profileName)) ??
            profile.secretKey;
        if (!secretKey) {
            throw new errors_1.CliError('CONFIG_ERROR', `Keychain entry missing for profile "${profileName}". Run \`cdnpro auth login -p ${profileName}\` to re-save credentials.`);
        }
        return {
            host: profile.host,
            user: profile.user,
            secretKey,
        };
    }
    throw new errors_1.CliError('CONFIG_ERROR', 'No credentials found. Run `cdnpro auth login` to set up a profile.');
}
function getProfile(name) {
    const profiles = store.get('profiles') ?? {};
    return profiles[name];
}
async function saveProfile(name, profile) {
    const profiles = store.get('profiles') ?? {};
    if (await (0, keychain_1.isKeychainAvailable)()) {
        await (0, keychain_1.setSecret)(name, profile.secretKey);
        profiles[name] = { host: profile.host, user: profile.user };
    }
    else {
        (0, keychain_1.warnKeychainUnavailable)();
        profiles[name] = { host: profile.host, user: profile.user, secretKey: profile.secretKey };
    }
    store.set('profiles', profiles);
}
async function deleteProfile(name) {
    await (0, keychain_1.deleteSecret)(name);
    const profiles = store.get('profiles') ?? {};
    delete profiles[name];
    store.set('profiles', profiles);
}
function listProfiles() {
    return store.get('profiles') ?? {};
}
function getDefaultProfile() {
    return store.get('defaultProfile') ?? 'default';
}
function setDefaultProfile(name) {
    store.set('defaultProfile', name);
}
/**
 * Prompt for input.
 * - silent=true  : mask typed characters with '*' (for secret keys)
 * - defaultValue : shown as [default] in the prompt; returned when the user presses Enter with no input
 */
function promptInput(question, silent = false, defaultValue) {
    const displayQuestion = defaultValue
        ? `${question} [${defaultValue}]: `
        : `${question}: `;
    return new Promise((resolve) => {
        if (silent) {
            process.stdout.write(displayQuestion);
            const isTTY = process.stdin.isTTY;
            if (isTTY) {
                // TTY mode: intercept keypresses and echo '*' for each character typed.
                // Resume stdin in case a prior readline.createInterface call paused it.
                process.stdin.resume();
                readline.emitKeypressEvents(process.stdin);
                process.stdin.setRawMode(true);
                let answer = '';
                const onKeypress = (_char, key) => {
                    if (key.name === 'return' || key.name === 'enter') {
                        process.stdin.setRawMode(false);
                        process.stdin.removeListener('keypress', onKeypress);
                        process.stdin.pause();
                        process.stdout.write('\n');
                        resolve(answer);
                    }
                    else if (key.name === 'backspace') {
                        if (answer.length > 0) {
                            answer = answer.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    }
                    else if (key.ctrl && key.name === 'c') {
                        process.stdin.setRawMode(false);
                        process.exit(0);
                    }
                    else if (key.sequence && !key.ctrl && !key.meta && key.sequence.length === 1) {
                        answer += key.sequence;
                        process.stdout.write('*');
                    }
                };
                process.stdin.on('keypress', onKeypress);
            }
            else {
                // Non-TTY (piped input): read silently without echo.
                const rl = readline.createInterface({ input: process.stdin, terminal: false });
                rl.once('line', (line) => {
                    process.stdout.write('\n');
                    rl.close();
                    resolve(line);
                });
            }
        }
        else {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question(displayQuestion, (answer) => {
                rl.close();
                resolve(answer.trim() ? answer : (defaultValue ?? answer));
            });
        }
    });
}
//# sourceMappingURL=config.js.map