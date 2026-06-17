import { Command } from 'commander';
import { registerCertVersionGetCommand } from './get';
import { registerCertVersionDeleteCommand } from './delete';

export function registerCertVersionCommands(parent: Command): void {
  const certVersion = parent
    .command('cert-version')
    .description('Manage individual certificate versions');

  registerCertVersionGetCommand(certVersion);
  registerCertVersionDeleteCommand(certVersion);
}
