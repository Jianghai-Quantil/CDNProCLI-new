"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShieldCommands = registerShieldCommands;
const list_1 = require("./list");
const get_1 = require("./get");
function registerShieldCommands(parent) {
    const cmd = parent
        .command('shield')
        .description('View origin shields (read-only)');
    (0, list_1.registerShieldListCommand)(cmd);
    (0, get_1.registerShieldGetCommand)(cmd);
}
//# sourceMappingURL=index.js.map