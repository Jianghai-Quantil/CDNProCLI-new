"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPropertyVersionGetCommand = registerPropertyVersionGetCommand;
const config_1 = require("../../config");
const CDNProClient_1 = require("../../../client/CDNProClient");
const output_1 = require("../../output");
const errors_1 = require("../../errors");
function isRawResponse(v) {
    return typeof v === 'object' && v !== null && 'obj' in v && 'ctx' in v;
}
function registerPropertyVersionGetCommand(parent) {
    parent
        .command('get <propertyId> <version>')
        .description('Get a specific version of a property')
        .action(async (propertyId, version, _opts, cmd) => {
        try {
            const globals = cmd.optsWithGlobals();
            const serverInfo = await (0, config_1.resolveCredentials)(globals);
            const client = new CDNProClient_1.CDNProClient(serverInfo);
            const fmt = globals.output;
            const reqOptions = {
                ...(globals.onBehalfOf ? { onBehalfOf: globals.onBehalfOf } : {}),
                ...(globals.verbose ? { verbose: globals.verbose } : {}),
                raw: true,
            };
            const rsp = await client.properties.getVersion(propertyId, version, reqOptions);
            let data;
            const meta = {};
            if (isRawResponse(rsp)) {
                data = rsp.obj;
                const lm = rsp.ctx._res.headers['last-modified'];
                if (lm)
                    meta.lastModified = Array.isArray(lm) ? lm[0] : lm;
            }
            else {
                data = rsp;
            }
            const effectiveFmt = fmt ?? (process.stdout.isTTY ? 'table' : 'json');
            if (effectiveFmt === 'table') {
                (0, output_1.printTable)(data);
            }
            else {
                (0, output_1.printJson)(data, Object.keys(meta).length > 0 ? meta : undefined);
            }
        }
        catch (err) {
            (0, errors_1.handleError)(err);
        }
    });
}
//# sourceMappingURL=get.js.map