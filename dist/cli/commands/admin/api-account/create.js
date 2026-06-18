"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminApiAccountCreateCommand = registerAdminApiAccountCreateCommand;
const config_1 = require("../../../config");
const CDNProClient_1 = require("../../../../client/CDNProClient");
const output_1 = require("../../../output");
const errors_1 = require("../../../errors");
const util_1 = require("../../../util");
const synthesize_1 = require("../../../../schema/synthesize");
const validate_1 = require("../../../../schema/validate");
function registerAdminApiAccountCreateCommand(parent) {
    parent
        .command('create')
        .description('Create an API account')
        .option('--file <path>', 'Request body as JSON (- for stdin)')
        .option('--example', 'Print an example request body and exit')
        .action(async (opts, cmd) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/ngadmin/apiAccounts', 'post');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            if (!opts.file) {
                process.stderr.write('Error: required option \'--file <path>\' not specified\n');
                process.exit(1);
            }
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const body = (0, util_1.readBodyFile)(opts.file);
            const validation = (0, validate_1.validateBody)('/ngadmin/apiAccounts', 'post', body);
            if (!validation.valid)
                (0, util_1.emitValidationError)(validation, 'cdnpro admin api-account create --example', globals.output);
            const reqOptions = {
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const raw = await client.apiAccounts.create(body, { ...reqOptions, raw: true });
            const data = (0, util_1.enrichWithLocationId)(raw);
            const id = data['id'];
            (0, output_1.printCreateSuccess)('API Account', 'apiAccountId', id, globals.output);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=create.js.map