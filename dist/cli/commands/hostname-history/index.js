"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHostnameHistoryCommands = registerHostnameHistoryCommands;
const list_1 = require("./list");
const get_1 = require("./get");
function registerHostnameHistoryCommands(parent) {
    const cmd = parent
        .command('hostname-history')
        .description('View hostname deployment history');
    (0, list_1.registerHostnameHistoryListCommand)(cmd);
    (0, get_1.registerHostnameHistoryGetCommand)(cmd);
}
//# sourceMappingURL=index.js.map