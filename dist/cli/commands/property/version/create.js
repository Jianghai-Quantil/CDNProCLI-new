"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPropertyVersionCreateCommand = registerPropertyVersionCreateCommand;
const config_1 = require("../../../config");
const CDNProClient_1 = require("../../../../client/CDNProClient");
const output_1 = require("../../../output");
const errors_1 = require("../../../errors");
const util_1 = require("../../../util");
const synthesize_1 = require("../../../../schema/synthesize");
const validate_1 = require("../../../../schema/validate");
function registerPropertyVersionCreateCommand(parent) {
    parent
        .command('create <propertyId>')
        .description('Create a new version of a property')
        .option('--file <path>', 'JSON body file (use - for stdin)')
        .option('--example', 'Print an example request body and exit')
        .action(async (propertyId, opts, cmd) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/cdn/properties/{propertyID}/versions', 'post');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            if (!opts.file) {
                process.stderr.write('Error: --file <path> is required (use - for stdin)\n');
                process.exit(1);
            }
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const body = (0, util_1.readBodyFile)(opts.file);
            const validation = (0, validate_1.validateBody)('/cdn/properties/{propertyID}/versions', 'post', body);
            if (!validation.valid)
                (0, util_1.emitValidationError)(validation, 'cdnpro property version create --example', globals.output);
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const data = await client.properties.createVersion(propertyId, body, reqOptions);
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
//# sourceMappingURL=create.js.map