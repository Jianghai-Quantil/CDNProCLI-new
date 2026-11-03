import { Command } from 'commander';
import chalk from 'chalk';
import {
  saveProfile,
  deleteProfile,
  listProfiles,
  getDefaultProfile,
  setDefaultProfile,
  resolveCredentials,
  promptInput,
  Profile,
  GlobalOptions,
} from '../config';
import { CDNProClient } from '../../client/CDNProClient';
import { handleError, CliError } from '../errors';

export function registerAuthCommands(parent: Command): void {
  const auth = parent
    .command('auth')
    .description('Manage credential profiles');

  // cdnpro auth login [--profile <name>]
  auth
    .command('login')
    .description('Save API credentials to a named profile')
    .option('-p, --profile <name>', 'Profile name to create or overwrite', 'default')
    .action(async (opts: { profile?: string }, cmd: Command) => {
      try {
        // The root command owns the same -p/--profile flag and consumes it
        // before this command does, so the local option stays at its default.
        // optsWithGlobals() is the name the user actually passed.
        const profileName = cmd.optsWithGlobals<GlobalOptions>().profile ?? opts.profile ?? 'default';
        console.log(`Configuring profile: ${chalk.bold(profileName)}\n`);

        const host = await promptInput('API host', false, 'ngapi.cdnetworks.com');
        const user = await promptInput('Username');
        const secretKey = await promptInput('Secret key', true);

        if (!host.trim() || !user.trim() || !secretKey.trim()) {
          throw new CliError('CONFIG_ERROR', 'Host, username, and secret key are all required.');
        }

        const profile: Profile = {
          host: host.trim(),
          user: user.trim(),
          secretKey: secretKey.trim(),
        };

        // Read count before saving to correctly detect "first profile"
        const existingBefore = listProfiles();
        const isFirstProfile = Object.keys(existingBefore).length === 0;

        await saveProfile(profileName, profile);

        if (isFirstProfile || profileName === 'default') {
          setDefaultProfile(profileName);
        }

        console.log(chalk.green(`\nProfile "${profileName}" saved.`));
      } catch (err) {
        handleError(err);
      }
    });

  // cdnpro auth logout [--profile <name>]
  auth
    .command('logout')
    .description('Remove a credential profile')
    .option('-p, --profile <name>', 'Profile to remove (active default profile if omitted)')
    .action(async (opts: { profile?: string }, cmd: Command) => {
      try {
        // No --profile means the profile marked (default) in `auth list`.
        // That stored name can outlive the profile itself, so an empty list
        // must not be reported as a missing named profile.
        const requested = cmd.optsWithGlobals<GlobalOptions>().profile ?? opts.profile;
        const profiles = listProfiles();
        if (!requested && Object.keys(profiles).length === 0) {
          throw new CliError('CONFIG_ERROR', 'No profiles configured. Run `cdnpro auth login`.');
        }
        const activeDefault = getDefaultProfile();
        const profileName = requested ?? activeDefault;
        if (!profiles[profileName]) {
          throw new CliError('CONFIG_ERROR', `Profile "${profileName}" not found.`);
        }
        await deleteProfile(profileName);
        console.log(chalk.green(`Profile "${profileName}" removed.`));

        if (profileName === activeDefault) {
          const remaining = Object.keys(listProfiles());
          if (remaining.length > 0) {
            setDefaultProfile(remaining[0]);
            console.log(chalk.green(`Default profile set to "${remaining[0]}".`));
          } else {
            setDefaultProfile('default');
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // cdnpro auth list
  auth
    .command('list')
    .description('List all saved credential profiles')
    .action(() => {
      try {
        const profiles = listProfiles();
        const defaultName = getDefaultProfile();

        if (Object.keys(profiles).length === 0) {
          console.log(chalk.dim('No profiles configured. Run `cdnpro auth login`.'));
          return;
        }

        for (const [name, p] of Object.entries(profiles)) {
          const marker = name === defaultName ? chalk.green(' (default)') : '';
          const secretHint = p.secretKey ? chalk.yellow('config file') : chalk.green('keychain');
          console.log(`${chalk.bold(name)}${marker}`);
          console.log(`  host:      ${p.host}`);
          console.log(`  user:      ${p.user}`);
          console.log(`  secretKey: ${'*'.repeat(8)} (${secretHint})`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // cdnpro auth switch <profile>
  auth
    .command('switch <profile>')
    .description('Set the default credential profile')
    .action((profileName: string) => {
      try {
        const profiles = listProfiles();
        if (!profiles[profileName]) {
          throw new CliError('CONFIG_ERROR', `Profile "${profileName}" not found.`);
        }
        setDefaultProfile(profileName);
        console.log(chalk.green(`Default profile set to "${profileName}".`));
      } catch (err) {
        handleError(err);
      }
    });

  // cdnpro auth status
  auth
    .command('status')
    .description('Test credentials with a lightweight API call')
    .option('-p, --profile <name>', 'Profile to test')
    .option('--host <host>', 'Override API host')
    .option('--user <user>', 'Override username')
    .option('--secret-key <key>', 'Override secret key')
    .action(async (_opts: { profile?: string; host?: string; user?: string; secretKey?: string }, cmd: Command) => {
      try {
        // Same flag collision as login: --profile/--host/--user/--secret-key
        // are defined on the root command, which consumes them.
        const globals = cmd.optsWithGlobals<GlobalOptions>();
        const serverInfo = await resolveCredentials({
          profile: globals.profile,
          host: globals.host,
          user: globals.user,
          secretKey: globals.secretKey,
        });

        const client = new CDNProClient(serverInfo);
        await client.properties.list({ limit: 1 } as Record<string, unknown>);

        console.log(chalk.green('Credentials OK'));
        console.log(`  host: ${serverInfo.host}`);
        console.log(`  user: ${serverInfo.user}`);
      } catch (err) {
        handleError(err);
      }
    });
}
