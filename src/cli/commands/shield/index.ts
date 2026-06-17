import { Command } from 'commander';
import { registerShieldListCommand } from './list';
import { registerShieldGetCommand } from './get';

export function registerShieldCommands(parent: Command): void {
  const cmd = parent
    .command('shield')
    .description('View origin shields (read-only)');

  registerShieldListCommand(cmd);
  registerShieldGetCommand(cmd);
}
