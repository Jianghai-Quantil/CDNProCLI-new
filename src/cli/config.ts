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

/**
 * Prompt for input.
 * - silent=true  : mask typed characters with '*' (for secret keys)
 * - defaultValue : shown as [default] in the prompt; returned when the user presses Enter with no input
 */
export function promptInput(question: string, silent = false, defaultValue?: string): Promise<string> {
  const displayQuestion = defaultValue
    ? `${question} [${defaultValue}]: `
    : `${question}: `;

  return new Promise((resolve) => {
    if (silent) {
      process.stdout.write(displayQuestion);

      const isTTY = (process.stdin as NodeJS.ReadStream).isTTY;

      if (isTTY) {
        // TTY mode: intercept keypresses and echo '*' for each character typed.
        // Resume stdin in case a prior readline.createInterface call paused it.
        process.stdin.resume();
        readline.emitKeypressEvents(process.stdin);
        (process.stdin as NodeJS.ReadStream).setRawMode!(true);

        let answer = '';

        const onKeypress = (_char: string, key: readline.Key) => {
          if (key.name === 'return' || key.name === 'enter') {
            (process.stdin as NodeJS.ReadStream).setRawMode!(false);
            process.stdin.removeListener('keypress', onKeypress);
            process.stdin.pause();
            process.stdout.write('\n');
            resolve(answer);
          } else if (key.name === 'backspace') {
            if (answer.length > 0) {
              answer = answer.slice(0, -1);
              process.stdout.write('\b \b');
            }
          } else if (key.ctrl && key.name === 'c') {
            (process.stdin as NodeJS.ReadStream).setRawMode!(false);
            process.exit(0);
          } else if (key.sequence && !key.ctrl && !key.meta && key.sequence.length === 1) {
            answer += key.sequence;
            process.stdout.write('*');
          }
        };

        process.stdin.on('keypress', onKeypress);
      } else {
        // Non-TTY (piped input): read silently without echo.
        const rl = readline.createInterface({ input: process.stdin, terminal: false });
        rl.once('line', (line) => {
          process.stdout.write('\n');
          rl.close();
          resolve(line);
        });
      }
    } else {
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
