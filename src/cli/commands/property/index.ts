import { Command } from 'commander';
import { registerPropertyListCommand } from './list';
import { registerPropertyGetCommand } from './get';
import { registerPropertyCreateCommand } from './create';
import { registerPropertyUpdateCommand } from './update';
import { registerPropertyDeleteCommand } from './delete';

export function registerPropertyCommands(parent: Command): void {
  const prop = parent
    .command('property')
    .description('Manage CDN properties');

  registerPropertyListCommand(prop);
  registerPropertyGetCommand(prop);
  registerPropertyCreateCommand(prop);
  registerPropertyUpdateCommand(prop);
  registerPropertyDeleteCommand(prop);
}
