"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthCommands = registerAuthCommands;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../config");
const CDNProClient_1 = require("../../client/CDNProClient");
const errors_1 = require("../errors");
function registerAuthCommands(parent) {
    const auth = parent
        .command('auth')
        .description('Manage credential profiles');
    // cdnpro auth login [--profile <name>]
    auth
        .command('login')
        .description('Save API credentials to a named profile')
        .option('-p, --profile <name>', 'Profile name to create or overwrite', 'default')
        .action(async (opts) => {
        try {
            console.log(`Configuring profile: ${chalk_1.default.bold(opts.profile)}\n`);
            const host = await (0, config_1.promptInput)('API host', false, 'ngapi.cdnetworks.com');
            const user = await (0, config_1.promptInput)('Username');
            const secretKey = await (0, config_1.promptInput)('Secret key', true);
            if (!host.trim() || !user.trim() || !secretKey.trim()) {
                throw new errors_1.CliError('CONFIG_ERROR', 'Host, username, and secret key are all required.');
            }
            const profile = {
                host: host.trim(),
                user: user.trim(),
                secretKey: secretKey.trim(),
            };
            // Read count before saving to correctly detect "first profile"
            const existingBefore = (0, config_1.listProfiles)();
            const isFirstProfile = Object.keys(existingBefore).length === 0;
            await (0, config_1.saveProfile)(opts.profile, profile);
            if (isFirstProfile || opts.profile === 'default') {
                (0, config_1.setDefaultProfile)(opts.profile);
            }
            console.log(chalk_1.default.green(`\nProfile "${opts.profile}" saved.`));
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
    // cdnpro auth logout [--profile <name>]
    auth
        .command('logout')
        .description('Remove a credential profile')
        .option('-p, --profile <name>', 'Profile to remove', 'default')
        .action(async (opts) => {
        try {
            const profiles = (0, config_1.listProfiles)();
            if (!profiles[opts.profile]) {
                throw new errors_1.CliError('CONFIG_ERROR', `Profile "${opts.profile}" not found.`);
            }
            await (0, config_1.deleteProfile)(opts.profile);
            console.log(chalk_1.default.green(`Profile "${opts.profile}" removed.`));
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
    // cdnpro auth list
    auth
        .command('list')
        .description('List all saved credential profiles')
        .action(() => {
        try {
            const profiles = (0, config_1.listProfiles)();
            const defaultName = (0, config_1.getDefaultProfile)();
            if (Object.keys(profiles).length === 0) {
                console.log(chalk_1.default.dim('No profiles configured. Run `cdnpro auth login`.'));
                return;
            }
            for (const [name, p] of Object.entries(profiles)) {
                const marker = name === defaultName ? chalk_1.default.green(' (default)') : '';
                const secretHint = p.secretKey ? chalk_1.default.yellow('config file') : chalk_1.default.green('keychain');
                console.log(`${chalk_1.default.bold(name)}${marker}`);
                console.log(`  host:      ${p.host}`);
                console.log(`  user:      ${p.user}`);
                console.log(`  secretKey: ${'*'.repeat(8)} (${secretHint})`);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
    // cdnpro auth switch <profile>
    auth
        .command('switch <profile>')
        .description('Set the default credential profile')
        .action((profileName) => {
        try {
            const profiles = (0, config_1.listProfiles)();
            if (!profiles[profileName]) {
                throw new errors_1.CliError('CONFIG_ERROR', `Profile "${profileName}" not found.`);
            }
            (0, config_1.setDefaultProfile)(profileName);
            console.log(chalk_1.default.green(`Default profile set to "${profileName}".`));
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
    // cdnpro auth status
    auth
        .command('status')
        .description('Test credentials with a lightweight API call')
        .option('-p, --profile <name>', 'Profile to test')
        .option('--host <host>', 'Override API host')
        .option('--user <user>', 'Override username')
        .option('--secret-key <key>', 'Override secret key')
        .action(async (opts) => {
        try {
            const serverInfo = await (0, config_1.resolveCredentials)({
                profile: opts.profile,
                host: opts.host,
                user: opts.user,
                secretKey: opts.secretKey,
            });
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            await client.properties.list({ limit: 1 });
            console.log(chalk_1.default.green('Credentials OK'));
            console.log(`  host: ${serverInfo.host}`);
            console.log(`  user: ${serverInfo.user}`);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=auth.js.map