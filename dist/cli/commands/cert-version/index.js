"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCertVersionCommands = registerCertVersionCommands;
const get_1 = require("./get");
const delete_1 = require("./delete");
function registerCertVersionCommands(parent) {
    const certVersion = parent
        .command('cert-version')
        .description('Manage individual certificate versions');
    (0, get_1.registerCertVersionGetCommand)(certVersion);
    (0, delete_1.registerCertVersionDeleteCommand)(certVersion);
}
//# sourceMappingURL=index.js.map