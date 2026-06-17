/**
 * Thin wrapper around keytar that provides graceful fallback when the OS
 * keychain is unavailable (headless CI, missing libsecret on Linux, etc.).
 *
 * No other module should import keytar directly — use this module instead.
 */

const SERVICE = 'cdnpro';

// keytar is loaded lazily so a native addon failure doesn't crash the process
// at startup. The result is cached after the first probe.
let keychainAvailableCache: boolean | null = null;
let warned = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadKeytar(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('keytar');
  } catch {
    return null;
  }
}

export async function isKeychainAvailable(): Promise<boolean> {
  if (keychainAvailableCache !== null) return keychainAvailableCache;

  const keytar = loadKeytar();
  if (!keytar) {
    keychainAvailableCache = false;
    return false;
  }

  try {
    // Probe with a sentinel that will not match any real entry.
    await keytar.getPassword(SERVICE, '__probe__');
    keychainAvailableCache = true;
  } catch {
    keychainAvailableCache = false;
  }

  return keychainAvailableCache;
}

export function warnKeychainUnavailable(): void {
  if (warned) return;
  warned = true;
  process.stderr.write(
    'Warning: OS keychain unavailable. Storing secret key in plaintext config file. ' +
      'Set CDNPRO_SECRETKEY environment variable for CI use.\n',
  );
}

export async function getSecret(profileName: string): Promise<string | null> {
  const keytar = loadKeytar();
  if (!keytar) return null;

  try {
    return await keytar.getPassword(SERVICE, `${SERVICE}:${profileName}`);
  } catch {
    return null;
  }
}

export async function setSecret(profileName: string, secretKey: string): Promise<void> {
  const keytar = loadKeytar();
  if (!keytar) throw new Error('keytar native addon failed to load');
  await keytar.setPassword(SERVICE, `${SERVICE}:${profileName}`, secretKey);
}

export async function deleteSecret(profileName: string): Promise<void> {
  const keytar = loadKeytar();
  if (!keytar) return;

  try {
    await keytar.deletePassword(SERVICE, `${SERVICE}:${profileName}`);
  } catch {
    // Silently ignore "not found" and other non-critical errors.
  }
}
