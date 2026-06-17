"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPropertyCommands = registerPropertyCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
function registerPropertyCommands(parent) {
    const prop = parent
        .command('property')
        .description('Manage CDN properties');
    (0, list_1.registerPropertyListCommand)(prop);
    (0, get_1.registerPropertyGetCommand)(prop);
    (0, create_1.registerPropertyCreateCommand)(prop);
    (0, update_1.registerPropertyUpdateCommand)(prop);
    (0, delete_1.registerPropertyDeleteCommand)(prop);
}
//# sourceMappingURL=index.js.map