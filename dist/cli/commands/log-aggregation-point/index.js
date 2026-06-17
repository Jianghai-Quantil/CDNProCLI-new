"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLogAggregationPointCommands = registerLogAggregationPointCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
const summary_1 = require("./summary");
function registerLogAggregationPointCommands(parent) {
    const cmd = parent
        .command('log-aggregation-point')
        .description('Manage log aggregation points');
    (0, list_1.registerLogAggregationPointListCommand)(cmd);
    (0, get_1.registerLogAggregationPointGetCommand)(cmd);
    (0, create_1.registerLogAggregationPointCreateCommand)(cmd);
    (0, update_1.registerLogAggregationPointUpdateCommand)(cmd);
    (0, delete_1.registerLogAggregationPointDeleteCommand)(cmd);
    (0, summary_1.registerLogAggregationPointSummaryCommand)(cmd);
}
//# sourceMappingURL=index.js.map