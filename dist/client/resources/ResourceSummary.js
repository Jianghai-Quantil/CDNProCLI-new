"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceSummary = void 0;
class ResourceSummary {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    getByCustomer(customerId, reqOptions = {}) {
        if (customerId === undefined || customerId === null || customerId === '') {
            throw new Error('customerId is required');
        }
        return this.api.request('GET', '/cdn/resourceSummary', { ...reqOptions, query: { customerId: String(customerId) } });
    }
}
exports.ResourceSummary = ResourceSummary;
//# sourceMappingURL=ResourceSummary.js.map