"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigs = void 0;
class SystemConfigs {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    get(reqOptions = {}) {
        return this.api.request('GET', '/cdn/systemConfigs', reqOptions);
    }
    update(patchBody, reqOptions = {}) {
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', '/cdn/systemConfigs', { ...reqOptions, body: patchBody });
    }
}
exports.SystemConfigs = SystemConfigs;
//# sourceMappingURL=SystemConfigs.js.map