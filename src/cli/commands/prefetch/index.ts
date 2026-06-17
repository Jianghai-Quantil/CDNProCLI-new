import { Command } from 'commander';
import { registerPrefetchCreateCommand } from './create';
import { registerPrefetchListCommand } from './list';
import { registerPrefetchGetCommand } from './get';
import { registerPrefetchTokensCommand } from './tokens';

export function registerPrefetchCommands(parent: Command): void {
  const cmd = parent
    .command('prefetch')
    .description('Manage prefetch requests');

  registerPrefetchCreateCommand(cmd);
  registerPrefetchListCommand(cmd);
  registerPrefetchGetCommand(cmd);
  registerPrefetchTokensCommand(cmd);
}
