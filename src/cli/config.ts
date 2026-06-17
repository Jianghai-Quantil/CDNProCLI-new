import Conf from 'conf';
import * as readline from 'readline';
import { ServerInfo } from '../client/ApiCore';
import { CliError } from './errors';
import { isKeychainAvailable, warnKeychainUnavailable, getSecret, setSecret, deleteSecret } from './keychain';

/** Shape stored in the conf JSON file — never contains the secret key. */
export interface StoredProfile {
  host: string;
  user: string;
  /** Present only when keychain is unavailable and secret must be stored as fallback. */
  secretKey?: string;
}

/** Fully-resolved in-memory profile with the secret key. Never persisted. */
export interface Profile {
  host: string;
  user: string;
  secretKey: string;
}

export interface CdnProConfig extends Record<string, unknown> {
  defaultProfile: string;
  profiles: Record<string, StoredProfile>;
}

export interface GlobalOptions {
  profile?: string;
  host?: string;
  user?: string;
  secretKey?: string;
  output?: string;
  noColor?: boolean;
  verbose?: number;
  onBehalfOf?: string;
}

// conf@9 stores data at ~/.config/cdnpro/config.json (Linux/macOS)
// or %APPDATA%\cdnpro\config.json (Windows).
const store = new Conf<CdnProConfig>({
  projectName: 'cdnpro',
  defaults: {
    defaultProfile: 'default',
    profiles: {},
  },
});

export async function resolveCredentials(globalOpts: GlobalOptions): Promise<ServerInfo> {
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
  const profileName =
    globalOpts.profile ??
    process.env['CDNPRO_PROFILE'] ??
    store.get('defaultProfile');

  const profiles = store.get('profiles') ?? {};
  const profile = profiles[profileName];

  if (profile) {
    const secretKey =
      (await getSecret(profileName)) ??
      profile.secretKey;

    if (!secretKey) {
      throw new CliError(
        'CONFIG_ERROR',
        `Keychain entry missing for profile "${profileName}". Run \`cdnpro auth login -p ${profileName}\` to re-save credentials.`,
      );
    }

    return {
      host: profile.host,
      user: profile.user,
      secretKey,
    };
  }

  throw new CliError(
    'CONFIG_ERROR',
    'No credentials found. Run `cdnpro auth login` to set up a profile.',
  );
}

export function getProfile(name: string): StoredProfile | undefined {
  const profiles = store.get('profiles') ?? {};
  return profiles[name];
}

export async function saveProfile(name: string, profile: Profile): Promise<void> {
  const profiles = store.get('profiles') ?? {};

  if (await isKeychainAvailable()) {
    await setSecret(name, profile.secretKey);
    profiles[name] = { host: profile.host, user: profile.user };
  } else {
    warnKeychainUnavailable();
    profiles[name] = { host: profile.host, user: profile.user, secretKey: profile.secretKey };
  }

  store.set('profiles', profiles);
}

export async function deleteProfile(name: string): Promise<void> {
  await deleteSecret(name);
  const profiles = store.get('profiles') ?? {};
  delete profiles[name];
  store.set('profiles', profiles);
}

export function listProfiles(): Record<string, StoredProfile> {
  return store.get('profiles') ?? {};
}

export function getDefaultProfile(): string {
  return store.get('defaultProfile') ?? 'default';
}

export function setDefaultProfile(name: string): void {
  store.set('defaultProfile', name);
}

/** Prompt for input. Pass silent=true to hide typed characters (for secret keys). */
export function promptInput(question: string, silent = false): Promise<string> {
  return new Promise((resolve) => {
    if (silent) {
      // Write the question manually; suppress readline's echo by patching stdout.write.
      process.stdout.write(question);

      const rl = readline.createInterface({ input: process.stdin, terminal: false });
      const origWrite = process.stdout.write.bind(process.stdout);
      // Suppress echo of the typed characters
      process.stdout.write = () => true;

      rl.once('line', (line) => {
        process.stdout.write = origWrite;
        process.stdout.write('\n');
        rl.close();
        resolve(line);
      });
      rl.once('close', () => {
        process.stdout.write = origWrite;
      });
    } else {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}
