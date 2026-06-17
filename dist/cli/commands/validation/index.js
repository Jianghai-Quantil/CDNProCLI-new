"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerValidationCommands = registerValidationCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
function registerValidationCommands(parent) {
    const validation = parent
        .command('validation')
        .description('Manage property validation tasks');
    (0, list_1.registerValidationListCommand)(validation);
    (0, get_1.registerValidationGetCommand)(validation);
    (0, create_1.registerValidationCreateCommand)(validation);
}
//# sourceMappingURL=index.js.map