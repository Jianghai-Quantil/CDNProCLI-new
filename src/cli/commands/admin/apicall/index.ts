import { Command } from 'commander';
import { registerAdminApiCallListCommand } from './list';
import { registerAdminApiCallGetCommand } from './get';

export function registerAdminApiCallCommands(parent: Command): void {
  const cmd = parent
    .command('apicall')
    .description('View API call audit log');

  registerAdminApiCallListCommand(cmd);
  registerAdminApiCallGetCommand(cmd);
}
