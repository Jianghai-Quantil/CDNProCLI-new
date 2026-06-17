import { Command } from 'commander';
import { registerHostnameListCommand } from './list';
import { registerHostnameGetCommand } from './get';

export function registerHostnameCommands(parent: Command): void {
  const cmd = parent
    .command('hostname')
    .description('Manage CDN hostnames');

  registerHostnameListCommand(cmd);
  registerHostnameGetCommand(cmd);
}
