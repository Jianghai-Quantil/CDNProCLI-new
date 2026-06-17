"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEdgeHostnameCommands = registerEdgeHostnameCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const replace_1 = require("./replace");
const delete_1 = require("./delete");
function registerEdgeHostnameCommands(parent) {
    const cmd = parent
        .command('edge-hostname')
        .description('Manage edge hostnames');
    (0, list_1.registerEdgeHostnameListCommand)(cmd);
    (0, get_1.registerEdgeHostnameGetCommand)(cmd);
    (0, create_1.registerEdgeHostnameCreateCommand)(cmd);
    (0, update_1.registerEdgeHostnameUpdateCommand)(cmd);
    (0, replace_1.registerEdgeHostnameReplaceCommand)(cmd);
    (0, delete_1.registerEdgeHostnameDeleteCommand)(cmd);
}
//# sourceMappingURL=index.js.map