"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSecretCommands = registerSecretCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
function registerSecretCommands(parent) {
    const cmd = parent
        .command('secret')
        .description('Manage secrets');
    (0, list_1.registerSecretListCommand)(cmd);
    (0, get_1.registerSecretGetCommand)(cmd);
    (0, create_1.registerSecretCreateCommand)(cmd);
    (0, update_1.registerSecretUpdateCommand)(cmd);
    (0, delete_1.registerSecretDeleteCommand)(cmd);
}
//# sourceMappingURL=index.js.map