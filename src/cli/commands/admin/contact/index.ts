import { Command } from 'commander';
import { registerAdminContactListCommand } from './list';
import { registerAdminContactGetCommand } from './get';
import { registerAdminContactCreateCommand } from './create';
import { registerAdminContactUpdateCommand } from './update';
import { registerAdminContactDeleteCommand } from './delete';

export function registerAdminContactCommands(parent: Command): void {
  const cmd = parent
    .command('contact')
    .description('Manage reseller contacts');

  registerAdminContactListCommand(cmd);
  registerAdminContactGetCommand(cmd);
  registerAdminContactCreateCommand(cmd);
  registerAdminContactUpdateCommand(cmd);
  registerAdminContactDeleteCommand(cmd);
}
