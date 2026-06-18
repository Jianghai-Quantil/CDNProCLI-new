"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPropertyVersionUpdateCommand = registerPropertyVersionUpdateCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const errors_1 = require("../../errors");
const util_1 = require("../../util");
const synthesize_1 = require("../../../schema/synthesize");
const validate_1 = require("../../../schema/validate");
function registerPropertyVersionUpdateCommand(parent) {
    parent
        .command('update [propertyId] [version]')
        .description('Update a property version (PATCH)')
        .option('--file <path>', 'JSON body file (use - for stdin)')
        .option('--if-unmodified-since <date>', 'If-Unmodified-Since header (RFC 1123); server returns 412 if modified since')
        .option('--example', 'Print an example request body and exit')
        .action(async (propertyId, version, opts, cmd) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/cdn/properties/{propertyID}/versions/{version}', 'patch');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, util_1.checkRequiredOption)(opts.file, '--file <path>');
            (0, util_1.checkRequiredOption)(propertyId, 'propertyId');
            (0, util_1.checkRequiredOption)(version, 'version');
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const body = (0, util_1.readBodyFile)(opts.file);
            const validation = (0, validate_1.validateBody)('/cdn/properties/{propertyID}/versions/{version}', 'patch', body);
            if (!validation.valid)
                (0, util_1.emitValidationError)(validation, 'cdnpro property-version update --example', globals.output);
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
                ...(opts.ifUnmodifiedSince
                    ? { headers: { 'If-Unmodified-Since': opts.ifUnmodifiedSince } }
                    : {}),
            };
            await client.properties.patchVersion(propertyId, version, body, reqOptions);
            if (!process.stdout.isTTY || globals.output) {
                process.stdout.write(JSON.stringify({ success: true }) + '\n');
            }
            else {
                process.stderr.write(`Property ${propertyId} version ${version} updated.\n`);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=update.js.map