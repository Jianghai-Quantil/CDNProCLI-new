"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPurgeCommands = registerPurgeCommands;
const create_1 = require("./create");
const list_1 = require("./list");
const get_1 = require("./get");
const summary_1 = require("./summary");
const tokens_1 = require("./tokens");
function registerPurgeCommands(parent) {
    const cmd = parent
        .command('purge')
        .description('Manage purge requests');
    (0, create_1.registerPurgeCreateCommand)(cmd);
    (0, list_1.registerPurgeListCommand)(cmd);
    (0, get_1.registerPurgeGetCommand)(cmd);
    (0, summary_1.registerPurgeSummaryCommand)(cmd);
    (0, tokens_1.registerPurgeTokensCommand)(cmd);
}
//# sourceMappingURL=index.js.map