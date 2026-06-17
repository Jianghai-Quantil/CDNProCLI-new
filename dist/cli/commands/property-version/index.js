"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPropertyVersionCommands = registerPropertyVersionCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
function registerPropertyVersionCommands(parent) {
    const propertyVersion = parent
        .command('property-version')
        .description('Manage property versions');
    (0, list_1.registerPropertyVersionListCommand)(propertyVersion);
    (0, get_1.registerPropertyVersionGetCommand)(propertyVersion);
    (0, create_1.registerPropertyVersionCreateCommand)(propertyVersion);
    (0, update_1.registerPropertyVersionUpdateCommand)(propertyVersion);
    (0, delete_1.registerPropertyVersionDeleteCommand)(propertyVersion);
}
//# sourceMappingURL=index.js.map