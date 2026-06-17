import { Command } from 'commander';
import { registerAnnotationListCommand } from './list';
import { registerAnnotationGetCommand } from './get';
import { registerAnnotationCreateCommand } from './create';
import { registerAnnotationUpdateCommand } from './update';
import { registerAnnotationDeleteCommand } from './delete';

export function registerAnnotationCommands(parent: Command): void {
  const cmd = parent
    .command('annotation')
    .description('Manage CDN annotations');

  registerAnnotationListCommand(cmd);
  registerAnnotationGetCommand(cmd);
  registerAnnotationCreateCommand(cmd);
  registerAnnotationUpdateCommand(cmd);
  registerAnnotationDeleteCommand(cmd);
}
