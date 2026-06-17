"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerApiPermissionCommands = registerApiPermissionCommands;
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
function registerApiPermissionCommands(parent) {
    const cmd = parent
        .command('api-permission')
        .description('Manage API permission sets');
    (0, get_1.registerApiPermissionGetCommand)(cmd);
    (0, create_1.registerApiPermissionCreateCommand)(cmd);
    (0, update_1.registerApiPermissionUpdateCommand)(cmd);
    (0, delete_1.registerApiPermissionDeleteCommand)(cmd);
}
//# sourceMappingURL=index.js.map