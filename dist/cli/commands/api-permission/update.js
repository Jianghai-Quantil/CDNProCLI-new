"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerApiPermissionUpdateCommand = registerApiPermissionUpdateCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const errors_1 = require("../../errors");
const util_1 = require("../../util");
const synthesize_1 = require("../../../schema/synthesize");
const validate_1 = require("../../../schema/validate");
function registerApiPermissionUpdateCommand(parent) {
    parent
        .command('update [id]')
        .description('Update an API permission set (PATCH)')
        .option('--file <path>', 'Request body as JSON (- for stdin)')
        .option('--example', 'Print an example request body and exit')
        .option('--if-unmodified-since <date>', 'Optimistic concurrency guard (If-Unmodified-Since header)')
        .action(async (id, opts, cmd) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/cdn/apiPermissions/{id}', 'patch');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, util_1.checkRequiredOption)(opts.file, "--file <path>");
            (0, util_1.checkRequiredOption)(id, 'id');
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const body = (0, util_1.readBodyFile)(opts.file);
            const validation = (0, validate_1.validateBody)('/cdn/apiPermissions/{id}', 'patch', body);
            if (!validation.valid)
                (0, util_1.emitValidationError)(validation, 'cdnpro api-permission update --example', globals.output);
            const headers = {};
            if (opts.ifUnmodifiedSince)
                headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
                ...(Object.keys(headers).length > 0 ? { headers } : {}),
            };
            await client.apiPermissions.update(id, body, reqOptions);
            if (!process.stdout.isTTY || globals.output) {
                process.stdout.write(JSON.stringify({ success: true }) + '\n');
            }
            else {
                process.stderr.write(`API permission ${id} updated.\n`);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=update.js.map