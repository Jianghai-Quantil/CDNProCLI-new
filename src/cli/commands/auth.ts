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
    .action(async (opts: { profile: string }) => {
      try {
        console.log(`Configuring profile: ${chalk.bold(opts.profile)}\n`);

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

        await saveProfile(opts.profile, profile);

        if (isFirstProfile || opts.profile === 'default') {
          setDefaultProfile(opts.profile);
        }

        console.log(chalk.green(`\nProfile "${opts.profile}" saved.`));
      } catch (err) {
        handleError(err);
      }
    });

  // cdnpro auth logout [--profile <name>]
  auth
    .command('logout')
    .description('Remove a credential profile')
    .option('-p, --profile <name>', 'Profile to remove', 'default')
    .action(async (opts: { profile: string }) => {
      try {
        const profiles = listProfiles();
        if (!profiles[opts.profile]) {
          throw new CliError('CONFIG_ERROR', `Profile "${opts.profile}" not found.`);
        }
        await deleteProfile(opts.profile);
        console.log(chalk.green(`Profile "${opts.profile}" removed.`));
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
    .action(async (opts: { profile?: string; host?: string; user?: string; secretKey?: string }) => {
      try {
        const serverInfo = await resolveCredentials({
          profile: opts.profile,
          host: opts.host,
          user: opts.user,
          secretKey: opts.secretKey,
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
