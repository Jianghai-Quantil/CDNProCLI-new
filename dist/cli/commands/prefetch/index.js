"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPrefetchCommands = registerPrefetchCommands;
const create_1 = require("./create");
const list_1 = require("./list");
const get_1 = require("./get");
const tokens_1 = require("./tokens");
function registerPrefetchCommands(parent) {
    const cmd = parent
        .command('prefetch')
        .description('Manage prefetch requests');
    (0, create_1.registerPrefetchCreateCommand)(cmd);
    (0, list_1.registerPrefetchListCommand)(cmd);
    (0, get_1.registerPrefetchGetCommand)(cmd);
    (0, tokens_1.registerPrefetchTokensCommand)(cmd);
}
//# sourceMappingURL=index.js.map