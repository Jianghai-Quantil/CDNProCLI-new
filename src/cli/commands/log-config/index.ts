import { Command } from 'commander';
import { registerLogConfigListCommand } from './list';
import { registerLogConfigGetCommand } from './get';
import { registerLogConfigCreateCommand } from './create';
import { registerLogConfigUpdateCommand } from './update';
import { registerLogConfigDeleteCommand } from './delete';

export function registerLogConfigCommands(parent: Command): void {
  const cmd = parent
    .command('log-config')
    .description('Manage log delivery configurations');

  registerLogConfigListCommand(cmd);
  registerLogConfigGetCommand(cmd);
  registerLogConfigCreateCommand(cmd);
  registerLogConfigUpdateCommand(cmd);
  registerLogConfigDeleteCommand(cmd);
}
