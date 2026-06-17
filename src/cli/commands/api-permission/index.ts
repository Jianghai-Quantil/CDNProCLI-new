import { Command } from 'commander';
import { registerApiPermissionGetCommand } from './get';
import { registerApiPermissionCreateCommand } from './create';
import { registerApiPermissionUpdateCommand } from './update';
import { registerApiPermissionDeleteCommand } from './delete';

export function registerApiPermissionCommands(parent: Command): void {
  const cmd = parent
    .command('api-permission')
    .description('Manage API permission sets');

  registerApiPermissionGetCommand(cmd);
  registerApiPermissionCreateCommand(cmd);
  registerApiPermissionUpdateCommand(cmd);
  registerApiPermissionDeleteCommand(cmd);
}
