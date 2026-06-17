import { Command } from 'commander';
import { registerSecretListCommand } from './list';
import { registerSecretGetCommand } from './get';
import { registerSecretCreateCommand } from './create';
import { registerSecretUpdateCommand } from './update';
import { registerSecretDeleteCommand } from './delete';

export function registerSecretCommands(parent: Command): void {
  const cmd = parent
    .command('secret')
    .description('Manage secrets');

  registerSecretListCommand(cmd);
  registerSecretGetCommand(cmd);
  registerSecretCreateCommand(cmd);
  registerSecretUpdateCommand(cmd);
  registerSecretDeleteCommand(cmd);
}
