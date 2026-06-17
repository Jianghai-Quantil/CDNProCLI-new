"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLogConfigCommands = registerLogConfigCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
function registerLogConfigCommands(parent) {
    const cmd = parent
        .command('log-config')
        .description('Manage log delivery configurations');
    (0, list_1.registerLogConfigListCommand)(cmd);
    (0, get_1.registerLogConfigGetCommand)(cmd);
    (0, create_1.registerLogConfigCreateCommand)(cmd);
    (0, update_1.registerLogConfigUpdateCommand)(cmd);
    (0, delete_1.registerLogConfigDeleteCommand)(cmd);
}
//# sourceMappingURL=index.js.map