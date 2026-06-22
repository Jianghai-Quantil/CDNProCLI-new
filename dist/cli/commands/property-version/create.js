"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROPERTY_VERSION_CREATE_OPTIONS = void 0;
exports.registerPropertyVersionCreateCommand = registerPropertyVersionCreateCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
const util_1 = require("../../util");
const synthesize_1 = require("../../../schema/synthesize");
const validate_1 = require("../../../schema/validate");
const option_map_1 = require("../../option-map");
exports.PROPERTY_VERSION_CREATE_OPTIONS = [
    ...option_map_1.FILE_EXAMPLE,
];
function registerPropertyVersionCreateCommand(parent) {
    const cmd = parent
        .command('create [propertyId]')
        .description('Create a new version of a property');
    (0, option_map_1.registerOptionsFromMapping)(cmd, exports.PROPERTY_VERSION_CREATE_OPTIONS);
    (0, option_map_1.registerMappings)('property-version', 'create', exports.PROPERTY_VERSION_CREATE_OPTIONS);
    cmd.action(async (propertyId, opts, cmdObj) => {
        try {
            if (opts.example) {
                const example = (0, synthesize_1.getExampleBody)('/cdn/properties/{propertyID}/versions', 'post');
                process.stdout.write(JSON.stringify(example, null, 2) + '\n');
                return;
            }
            (0, util_1.checkRequiredOption)(opts.file, '--file <path>');
            (0, util_1.checkRequiredOption)(propertyId, 'propertyId');
            const globals = cmdObj.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const body = (0, util_1.readBodyFile)(opts.file);
            const validation = (0, validate_1.validateBody)('/cdn/properties/{propertyID}/versions', 'post', body);
            if (!validation.valid)
                (0, util_1.emitValidationError)(validation, 'cdnpro property-version create --example', globals.output);
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
            };
            const raw = await client.properties.createVersion(propertyId, body, { ...reqOptions, raw: true });
            const data = (0, util_1.enrichWithLocationId)(raw);
            const id = data['id'];
            (0, output_1.printCreateSuccess)('Property Version', 'propertyVersionId', id, globals.output);
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=create.js.map