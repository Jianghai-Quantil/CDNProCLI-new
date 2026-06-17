"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeployCommands = registerDeployCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
function registerDeployCommands(parent) {
    const deploy = parent
        .command('deploy')
        .description('Manage deployment tasks');
    (0, list_1.registerDeployListCommand)(deploy);
    (0, get_1.registerDeployGetCommand)(deploy);
    (0, create_1.registerDeployCreateCommand)(deploy);
}
//# sourceMappingURL=index.js.map