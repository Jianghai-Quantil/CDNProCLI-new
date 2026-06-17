"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminCustomerCommands = registerAdminCustomerCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
function registerAdminCustomerCommands(parent) {
    const cmd = parent
        .command('customer')
        .description('Manage reseller sub-accounts (customers)');
    (0, list_1.registerAdminCustomerListCommand)(cmd);
    (0, get_1.registerAdminCustomerGetCommand)(cmd);
    (0, create_1.registerAdminCustomerCreateCommand)(cmd);
    (0, update_1.registerAdminCustomerUpdateCommand)(cmd);
}
//# sourceMappingURL=index.js.map