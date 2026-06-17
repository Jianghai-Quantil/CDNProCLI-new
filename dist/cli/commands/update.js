"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateCommand = registerUpdateCommand;
const chalk_1 = __importDefault(require("chalk"));
const updater_1 = require("../updater");
const config_1 = require("../config");
function registerUpdateCommand(parent) {
    parent
        .command('update')
        .description('Update cdnpro-cli to the latest version')
        .option('--check', 'Only check if an update is available; do not install')
        .option('-y, --yes', 'Skip confirmation prompt')
        .action(async (opts) => {
        // 1. Detect install scope first — fail fast for npx
        const installInfo = (0, updater_1.detectInstallInfo)();
        if (installInfo.scope === 'npx') {
            console.log(chalk_1.default.dim('No persistent install found (running via npx).\n' +
                'npx always uses the latest published version — no update needed.'));
            process.exit(0);
        }
        // 2. Fetch latest version from registry
        process.stdout.write('Checking npm registry... ');
        let latest;
        try {
            latest = await (0, updater_1.fetchLatestVersion)();
        }
        catch (err) {
            process.stdout.write(chalk_1.default.red('failed\n'));
            process.stderr.write(`Could not reach npm registry: ${err instanceof Error ? err.message : String(err)}\n`);
            process.exit(1);
        }
        process.stdout.write(chalk_1.default.dim('done\n'));
        // 3. Compare versions
        if (!(0, updater_1.isNewer)(updater_1.CURRENT_VERSION, latest)) {
            console.log(chalk_1.default.green(`Already on the latest version (${updater_1.CURRENT_VERSION}).`));
            process.exit(0);
        }
        // 4. Build the correct update command for this install scope
        const updateCmd = (0, updater_1.buildUpdateCommand)(installInfo);
        if (!updateCmd) {
            // Should not be reachable given the npx guard above, but be safe
            console.log(chalk_1.default.dim('No update command could be determined.'));
            process.exit(0);
        }
        // 5. Show what will run
        console.log(`Update available: ${chalk_1.default.dim(updater_1.CURRENT_VERSION)} → ${chalk_1.default.green(latest)}`);
        console.log(chalk_1.default.dim(`Command: ${updateCmd.description}`));
        // --check: print status and exit without installing
        if (opts.check) {
            process.exit(1); // exit 1 = update available (useful in CI)
        }
        // 6. Confirm unless --yes
        if (!opts.yes) {
            const answer = await (0, config_1.promptInput)('\nProceed with update? [y/N] ');
            if (answer.trim().toLowerCase() !== 'y') {
                console.log(chalk_1.default.dim('Aborted.'));
                process.exit(0);
            }
        }
        // 7. Run the update
        console.log('');
        const exitCode = await (0, updater_1.runUpdateCommand)(updateCmd);
        process.exit(exitCode);
    });
}
//# sourceMappingURL=update.js.map