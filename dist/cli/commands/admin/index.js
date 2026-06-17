"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminCommands = registerAdminCommands;
const index_1 = require("./customer/index");
const index_2 = require("./contact/index");
const index_3 = require("./api-account/index");
const index_4 = require("./apicall/index");
function registerAdminCommands(parent) {
    const admin = parent
        .command('admin')
        .description('Admin commands for reseller management (/ngadmin/ endpoints — requires elevated credentials)');
    (0, index_1.registerAdminCustomerCommands)(admin);
    (0, index_2.registerAdminContactCommands)(admin);
    (0, index_3.registerAdminApiAccountCommands)(admin);
    (0, index_4.registerAdminApiCallCommands)(admin);
}
//# sourceMappingURL=index.js.map