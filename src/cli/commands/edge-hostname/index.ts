import { Command } from 'commander';
import { registerEdgeHostnameListCommand } from './list';
import { registerEdgeHostnameGetCommand } from './get';
import { registerEdgeHostnameCreateCommand } from './create';
import { registerEdgeHostnameUpdateCommand } from './update';
import { registerEdgeHostnameReplaceCommand } from './replace';
import { registerEdgeHostnameDeleteCommand } from './delete';

export function registerEdgeHostnameCommands(parent: Command): void {
  const cmd = parent
    .command('edge-hostname')
    .description('Manage edge hostnames');

  registerEdgeHostnameListCommand(cmd);
  registerEdgeHostnameGetCommand(cmd);
  registerEdgeHostnameCreateCommand(cmd);
  registerEdgeHostnameUpdateCommand(cmd);
  registerEdgeHostnameReplaceCommand(cmd);
  registerEdgeHostnameDeleteCommand(cmd);
}
