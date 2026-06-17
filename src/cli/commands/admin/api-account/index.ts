import { Command } from 'commander';
import { registerAdminApiAccountListCommand } from './list';
import { registerAdminApiAccountGetCommand } from './get';
import { registerAdminApiAccountCreateCommand } from './create';
import { registerAdminApiAccountUpdateCommand } from './update';
import { registerAdminApiAccountDeleteCommand } from './delete';

export function registerAdminApiAccountCommands(parent: Command): void {
  const cmd = parent
    .command('api-account')
    .description('Manage API accounts for reseller sub-accounts');

  registerAdminApiAccountListCommand(cmd);
  registerAdminApiAccountGetCommand(cmd);
  registerAdminApiAccountCreateCommand(cmd);
  registerAdminApiAccountUpdateCommand(cmd);
  registerAdminApiAccountDeleteCommand(cmd);
}
