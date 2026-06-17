"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWebhookCommands = registerWebhookCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
function registerWebhookCommands(parent) {
    const cmd = parent
        .command('webhook')
        .description('Manage webhooks');
    (0, list_1.registerWebhookListCommand)(cmd);
    (0, get_1.registerWebhookGetCommand)(cmd);
    (0, create_1.registerWebhookCreateCommand)(cmd);
    (0, update_1.registerWebhookUpdateCommand)(cmd);
    (0, delete_1.registerWebhookDeleteCommand)(cmd);
}
//# sourceMappingURL=index.js.map