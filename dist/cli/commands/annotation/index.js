"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAnnotationCommands = registerAnnotationCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
function registerAnnotationCommands(parent) {
    const cmd = parent
        .command('annotation')
        .description('Manage CDN annotations');
    (0, list_1.registerAnnotationListCommand)(cmd);
    (0, get_1.registerAnnotationGetCommand)(cmd);
    (0, create_1.registerAnnotationCreateCommand)(cmd);
    (0, update_1.registerAnnotationUpdateCommand)(cmd);
    (0, delete_1.registerAnnotationDeleteCommand)(cmd);
}
//# sourceMappingURL=index.js.map