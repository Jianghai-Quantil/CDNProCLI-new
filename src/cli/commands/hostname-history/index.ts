import { Command } from 'commander';
import { registerHostnameHistoryListCommand } from './list';
import { registerHostnameHistoryGetCommand } from './get';

export function registerHostnameHistoryCommands(parent: Command): void {
  const cmd = parent
    .command('hostname-history')
    .description('View hostname deployment history');

  registerHostnameHistoryListCommand(cmd);
  registerHostnameHistoryGetCommand(cmd);
}
