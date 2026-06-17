"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCertCommands = registerCertCommands;
const list_1 = require("./list");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
const download_csr_1 = require("./download-csr");
function registerCertCommands(parent) {
    const cert = parent
        .command('cert')
        .description('Manage CDN certificates');
    (0, list_1.registerCertListCommand)(cert);
    (0, get_1.registerCertGetCommand)(cert);
    (0, create_1.registerCertCreateCommand)(cert);
    (0, update_1.registerCertUpdateCommand)(cert);
    (0, delete_1.registerCertDeleteCommand)(cert);
    (0, download_csr_1.registerCertDownloadCsrCommand)(cert);
}
//# sourceMappingURL=index.js.map