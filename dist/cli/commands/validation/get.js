"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerValidationGetCommand = registerValidationGetCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
function registerValidationGetCommand(parent) {
    parent
        .command('get <id>')
        .description('Get a validation task by ID')
        .action(async (id, _opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.validations.get(id, reqOptions);
            const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
            if (effectiveFmt === 'table') {
                (0, output_1.printTable)(data);
            }
            else {
                (0, output_1.printJson)(data);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=get.js.map