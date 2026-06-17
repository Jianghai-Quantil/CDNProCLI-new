"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminApiCallCommands = registerAdminApiCallCommands;
const list_1 = require("./list");
const get_1 = require("./get");
function registerAdminApiCallCommands(parent) {
    const cmd = parent
        .command('apicall')
        .description('View API call audit log');
    (0, list_1.registerAdminApiCallListCommand)(cmd);
    (0, get_1.registerAdminApiCallGetCommand)(cmd);
}
//# sourceMappingURL=index.js.map