"use strict";
/**
 * Thin wrapper around keytar that provides graceful fallback when the OS
 * keychain is unavailable (headless CI, missing libsecret on Linux, etc.).
 *
 * No other module should import keytar directly — use this module instead.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isKeychainAvailable = isKeychainAvailable;
exports.warnKeychainUnavailable = warnKeychainUnavailable;
exports.getSecret = getSecret;
exports.setSecret = setSecret;
exports.deleteSecret = deleteSecret;
const SERVICE = 'cdnpro';
// keytar is loaded lazily so a native addon failure doesn't crash the process
// at startup. The result is cached after the first probe.
let keychainAvailableCache = null;
let warned = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadKeytar() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('keytar');
    }
    catch {
        return null;
    }
}
async function isKeychainAvailable() {
    if (keychainAvailableCache !== null)
        return keychainAvailableCache;
    const keytar = loadKeytar();
    if (!keytar) {
        keychainAvailableCache = false;
        return false;
    }
    try {
        // Probe with a sentinel that will not match any real entry.
        await keytar.getPassword(SERVICE, '__probe__');
        keychainAvailableCache = true;
    }
    catch {
        keychainAvailableCache = false;
    }
    return keychainAvailableCache;
}
function warnKeychainUnavailable() {
    if (warned)
        return;
    warned = true;
    process.stderr.write('Warning: OS keychain unavailable. Storing secret key in plaintext config file. ' +
        'Set CDNPRO_SECRETKEY environment variable for CI use.\n');
}
async function getSecret(profileName) {
    const keytar = loadKeytar();
    if (!keytar)
        return null;
    try {
        return await keytar.getPassword(SERVICE, `${SERVICE}:${profileName}`);
    }
    catch {
        return null;
    }
}
async function setSecret(profileName, secretKey) {
    const keytar = loadKeytar();
    if (!keytar)
        throw new Error('keytar native addon failed to load');
    await keytar.setPassword(SERVICE, `${SERVICE}:${profileName}`, secretKey);
}
async function deleteSecret(profileName) {
    const keytar = loadKeytar();
    if (!keytar)
        return;
    try {
        await keytar.deletePassword(SERVICE, `${SERVICE}:${profileName}`);
    }
    catch {
        // Silently ignore "not found" and other non-critical errors.
    }
}
//# sourceMappingURL=keychain.js.map