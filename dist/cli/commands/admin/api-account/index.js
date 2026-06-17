"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminApiAccountCommands = registerAdminApiAccountCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
function registerAdminApiAccountCommands(parent) {
    const cmd = parent
        .command('api-account')
        .description('Manage API accounts for reseller sub-accounts');
    (0, list_1.registerAdminApiAccountListCommand)(cmd);
    (0, get_1.registerAdminApiAccountGetCommand)(cmd);
    (0, create_1.registerAdminApiAccountCreateCommand)(cmd);
    (0, update_1.registerAdminApiAccountUpdateCommand)(cmd);
    (0, delete_1.registerAdminApiAccountDeleteCommand)(cmd);
}
//# sourceMappingURL=index.js.map