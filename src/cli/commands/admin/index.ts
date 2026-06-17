import { Command } from 'commander';
import { registerAdminCustomerCommands } from './customer/index';
import { registerAdminContactCommands } from './contact/index';
import { registerAdminApiAccountCommands } from './api-account/index';
import { registerAdminApiCallCommands } from './apicall/index';

export function registerAdminCommands(parent: Command): void {
  const admin = parent
    .command('admin')
    .description('Admin commands for reseller management (/ngadmin/ endpoints — requires elevated credentials)');

  registerAdminCustomerCommands(admin);
  registerAdminContactCommands(admin);
  registerAdminApiAccountCommands(admin);
  registerAdminApiCallCommands(admin);
}
