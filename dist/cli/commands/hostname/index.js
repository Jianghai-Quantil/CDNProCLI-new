"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHostnameCommands = registerHostnameCommands;
const list_1 = require("./list");
const get_1 = require("./get");
function registerHostnameCommands(parent) {
    const cmd = parent
        .command('hostname')
        .description('Manage CDN hostnames');
    (0, list_1.registerHostnameListCommand)(cmd);
    (0, get_1.registerHostnameGetCommand)(cmd);
}
//# sourceMappingURL=index.js.map