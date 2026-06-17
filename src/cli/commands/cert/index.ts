import { Command } from 'commander';
import { registerCertListCommand } from './list';
import { registerCertGetCommand } from './get';
import { registerCertCreateCommand } from './create';
import { registerCertUpdateCommand } from './update';
import { registerCertDeleteCommand } from './delete';
import { registerCertDownloadCsrCommand } from './download-csr';

export function registerCertCommands(parent: Command): void {
  const cert = parent
    .command('cert')
    .description('Manage CDN certificates');

  registerCertListCommand(cert);
  registerCertGetCommand(cert);
  registerCertCreateCommand(cert);
  registerCertUpdateCommand(cert);
  registerCertDeleteCommand(cert);
  registerCertDownloadCsrCommand(cert);
}
