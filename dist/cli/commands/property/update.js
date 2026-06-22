"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROPERTY_UPDATE_OPTIONS = void 0;
exports.registerPropertyUpdateCommand = registerPropertyUpdateCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const errors_1 = require("../../errors");
const util_1 = require("../../util");
const synthesize_1 = require("../../../schema/synthesize");
const validate_1 = require("../../../schema/validate");
const option_map_1 = require("../../option-map");
exports.PROPERTY_UPDATE_OPTIONS = [...option_map_1.FILE_EXAMPLE, option_map_1.IF_UNMODIFIED_SINCE];
function registerPropertyUpdateCommand(parent) {
    (0, option_map_1.registerMappings)('property', 'update', exports.PROPERTY_UPDATE_OPTIONS);
    const cmd = parent
        .command('update [id]')
        .description('Update a property (PATCH)');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.PROPERTY_UPDATE_OPTIONS);
    cmd.action(async (id, opts, cmdObj) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/cdn/properties/{propertyID}', 'patch');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, util_1.checkRequiredOption)(opts.file, '--file <path>');
            (0, util_1.checkRequiredOption)(id, 'id');
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const body = (0, util_1.readBodyFile)(opts.file);
            const validation = (0, validate_1.validateBody)('/cdn/properties/{propertyID}', 'patch', body);
            if (!validation.valid)
                (0, util_1.emitValidationError)(validation, 'cdnpro property update --example', globals.output);
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
                ...(opts.ifUnmodifiedSince
                    ? { headers: { 'If-Unmodified-Since': opts.ifUnmodifiedSince } }
                    : {}),
            };
            await client.properties.update(id, body, reqOptions);
            // 204 No Content — emit a minimal success response
            if (!process.stdout.isTTY || globals.output) {
                process.stdout.write(JSON.stringify({ success: true }) + '\n');
            }
            else {
                process.stderr.write(`Property ${id} updated.\n`);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=update.js.map