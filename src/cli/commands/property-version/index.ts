import { Command } from 'commander';
import { registerPropertyVersionListCommand } from './list';
import { registerPropertyVersionGetCommand } from './get';
import { registerPropertyVersionCreateCommand } from './create';
import { registerPropertyVersionUpdateCommand } from './update';
import { registerPropertyVersionDeleteCommand } from './delete';

export function registerPropertyVersionCommands(parent: Command): void {
  const propertyVersion = parent
    .command('property-version')
    .description('Manage property versions');

  registerPropertyVersionListCommand(propertyVersion);
  registerPropertyVersionGetCommand(propertyVersion);
  registerPropertyVersionCreateCommand(propertyVersion);
  registerPropertyVersionUpdateCommand(propertyVersion);
  registerPropertyVersionDeleteCommand(propertyVersion);
}
