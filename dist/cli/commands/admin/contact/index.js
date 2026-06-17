"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminContactCommands = registerAdminContactCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
function registerAdminContactCommands(parent) {
    const cmd = parent
        .command('contact')
        .description('Manage reseller contacts');
    (0, list_1.registerAdminContactListCommand)(cmd);
    (0, get_1.registerAdminContactGetCommand)(cmd);
    (0, create_1.registerAdminContactCreateCommand)(cmd);
    (0, update_1.registerAdminContactUpdateCommand)(cmd);
    (0, delete_1.registerAdminContactDeleteCommand)(cmd);
}
//# sourceMappingURL=index.js.map