"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentTasks = void 0;
class DeploymentTasks {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/deploymentTasks', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        return this.api.request('GET', `/cdn/deploymentTasks/${encodeURIComponent(id)}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/deploymentTasks', { ...reqOptions, body });
    }
}
exports.DeploymentTasks = DeploymentTasks;
//# sourceMappingURL=DeploymentTasks.js.map