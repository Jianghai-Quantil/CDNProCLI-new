import { Command } from 'commander';
import { registerWebhookListCommand } from './list';
import { registerWebhookGetCommand } from './get';
import { registerWebhookCreateCommand } from './create';
import { registerWebhookUpdateCommand } from './update';
import { registerWebhookDeleteCommand } from './delete';

export function registerWebhookCommands(parent: Command): void {
  const cmd = parent
    .command('webhook')
    .description('Manage webhooks');

  registerWebhookListCommand(cmd);
  registerWebhookGetCommand(cmd);
  registerWebhookCreateCommand(cmd);
  registerWebhookUpdateCommand(cmd);
  registerWebhookDeleteCommand(cmd);
}
