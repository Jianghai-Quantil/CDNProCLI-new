import { Command } from 'commander';
import { registerDeployListCommand } from './list';
import { registerDeployGetCommand } from './get';
import { registerDeployCreateCommand } from './create';

export function registerDeployCommands(parent: Command): void {
  const deploy = parent
    .command('deploy')
    .description('Manage deployment tasks');

  registerDeployListCommand(deploy);
  registerDeployGetCommand(deploy);
  registerDeployCreateCommand(deploy);
}
