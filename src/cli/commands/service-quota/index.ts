import { Command } from 'commander';
import { registerServiceQuotaListCommand } from './list';
import { registerServiceQuotaGetCommand } from './get';
import { registerServiceQuotaUpdateCommand } from './update';

export function registerServiceQuotaCommands(parent: Command): void {
  const cmd = parent
    .command('service-quota')
    .description('Manage service quotas');

  registerServiceQuotaListCommand(cmd);
  registerServiceQuotaGetCommand(cmd);
  registerServiceQuotaUpdateCommand(cmd);
}
