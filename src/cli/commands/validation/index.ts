import { Command } from 'commander';
import { registerValidationListCommand } from './list';
import { registerValidationGetCommand } from './get';
import { registerValidationCreateCommand } from './create';

export function registerValidationCommands(parent: Command): void {
  const validation = parent
    .command('validation')
    .description('Manage property validation tasks');

  registerValidationListCommand(validation);
  registerValidationGetCommand(validation);
  registerValidationCreateCommand(validation);
}
