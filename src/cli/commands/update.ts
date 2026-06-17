import { Command } from 'commander';
import chalk from 'chalk';
import {
  CURRENT_VERSION,
  fetchLatestVersion,
  isNewer,
  detectInstallInfo,
  buildUpdateCommand,
  runUpdateCommand,
} from '../updater';
import { promptInput } from '../config';

export function registerUpdateCommand(parent: Command): void {
  parent
    .command('update')
    .description('Update cdnpro-cli to the latest version')
    .option('--check', 'Only check if an update is available; do not install')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (opts: { check?: boolean; yes?: boolean }) => {
      // 1. Detect install scope first — fail fast for npx
      const installInfo = detectInstallInfo();

      if (installInfo.scope === 'npx') {
        console.log(
          chalk.dim(
            'No persistent install found (running via npx).\n' +
              'npx always uses the latest published version — no update needed.',
          ),
        );
        process.exit(0);
      }

      // 2. Fetch latest version from registry
      process.stdout.write('Checking npm registry... ');
      let latest: string;
      try {
        latest = await fetchLatestVersion();
      } catch (err) {
        process.stdout.write(chalk.red('failed\n'));
        process.stderr.write(
          `Could not reach npm registry: ${err instanceof Error ? err.message : String(err)}\n`,
        );
        process.exit(1);
      }
      process.stdout.write(chalk.dim('done\n'));

      // 3. Compare versions
      if (!isNewer(CURRENT_VERSION, latest)) {
        console.log(
          chalk.green(`Already on the latest version (${CURRENT_VERSION}).`),
        );
        process.exit(0);
      }

      // 4. Build the correct update command for this install scope
      const updateCmd = buildUpdateCommand(installInfo);
      if (!updateCmd) {
        // Should not be reachable given the npx guard above, but be safe
        console.log(chalk.dim('No update command could be determined.'));
        process.exit(0);
      }

      // 5. Show what will run
      console.log(
        `Update available: ${chalk.dim(CURRENT_VERSION)} → ${chalk.green(latest)}`,
      );
      console.log(chalk.dim(`Command: ${updateCmd.description}`));

      // --check: print status and exit without installing
      if (opts.check) {
        process.exit(1); // exit 1 = update available (useful in CI)
      }

      // 6. Confirm unless --yes
      if (!opts.yes) {
        const answer = await promptInput('\nProceed with update? [y/N] ');
        if (answer.trim().toLowerCase() !== 'y') {
          console.log(chalk.dim('Aborted.'));
          process.exit(0);
        }
      }

      // 7. Run the update
      console.log('');
      const exitCode = await runUpdateCommand(updateCmd);
      process.exit(exitCode);
    });
}
