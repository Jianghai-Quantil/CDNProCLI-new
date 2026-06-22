"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_CUSTOMER_UPDATE_OPTIONS = void 0;
exports.registerAdminCustomerUpdateCommand = registerAdminCustomerUpdateCommand;
const config_1 = require("../../../config");
const CDNProClient_1 = require("../../../../client/CDNProClient");
const errors_1 = require("../../../errors");
const util_1 = require("../../../util");
const synthesize_1 = require("../../../../schema/synthesize");
const validate_1 = require("../../../../schema/validate");
const option_map_1 = require("../../../option-map");
exports.ADMIN_CUSTOMER_UPDATE_OPTIONS = [
    ...option_map_1.FILE_EXAMPLE,
    option_map_1.IF_UNMODIFIED_SINCE,
];
function registerAdminCustomerUpdateCommand(parent) {
    const cmd = parent
        .command('update [id]')
        .description('Update a customer (PATCH)');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.ADMIN_CUSTOMER_UPDATE_OPTIONS);
    (0, option_map_1.registerMappings)('admin-customer', 'update', exports.ADMIN_CUSTOMER_UPDATE_OPTIONS);
    cmd.action(async (id, opts, cmdObj) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/ngadmin/customers/{id}', 'patch');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, util_1.checkRequiredOption)(opts.file, "--file <path>");
            (0, util_1.checkRequiredOption)(id, 'id');
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const body = (0, util_1.readBodyFile)(opts.file);
            const validation = (0, validate_1.validateBody)('/ngadmin/customers/{id}', 'patch', body);
            if (!validation.valid)
                (0, util_1.emitValidationError)(validation, 'cdnpro admin customer update --example', globals.output);
            const reqOptions = {
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            await client.customers.update(id, body, reqOptions);
            if (!process.stdout.isTTY || globals.output) {
                process.stdout.write(JSON.stringify({ success: true }) + '\n');
            }
            else {
                process.stderr.write(`Customer ${id} updated.\n`);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=update.js.map