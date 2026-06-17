import { Command } from 'commander';
import { registerAdminCustomerListCommand } from './list';
import { registerAdminCustomerGetCommand } from './get';
import { registerAdminCustomerCreateCommand } from './create';
import { registerAdminCustomerUpdateCommand } from './update';

export function registerAdminCustomerCommands(parent: Command): void {
  const cmd = parent
    .command('customer')
    .description('Manage reseller sub-accounts (customers)');

  registerAdminCustomerListCommand(cmd);
  registerAdminCustomerGetCommand(cmd);
  registerAdminCustomerCreateCommand(cmd);
  registerAdminCustomerUpdateCommand(cmd);
}
