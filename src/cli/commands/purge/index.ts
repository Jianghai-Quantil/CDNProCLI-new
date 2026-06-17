import { Command } from 'commander';
import { registerPurgeCreateCommand } from './create';
import { registerPurgeListCommand } from './list';
import { registerPurgeGetCommand } from './get';
import { registerPurgeSummaryCommand } from './summary';
import { registerPurgeTokensCommand } from './tokens';

export function registerPurgeCommands(parent: Command): void {
  const cmd = parent
    .command('purge')
    .description('Manage purge requests');

  registerPurgeCreateCommand(cmd);
  registerPurgeListCommand(cmd);
  registerPurgeGetCommand(cmd);
  registerPurgeSummaryCommand(cmd);
  registerPurgeTokensCommand(cmd);
}
