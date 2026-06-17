"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerServiceQuotaCommands = registerServiceQuotaCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const update_1 = require("./update");
function registerServiceQuotaCommands(parent) {
    const cmd = parent
        .command('service-quota')
        .description('Manage service quotas');
    (0, list_1.registerServiceQuotaListCommand)(cmd);
    (0, get_1.registerServiceQuotaGetCommand)(cmd);
    (0, update_1.registerServiceQuotaUpdateCommand)(cmd);
}
//# sourceMappingURL=index.js.map