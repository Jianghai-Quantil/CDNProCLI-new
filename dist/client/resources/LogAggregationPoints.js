"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogAggregationPoints = void 0;
class LogAggregationPoints {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/logAggregationPoints', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('GET', `/cdn/logAggregationPoints/${encodeURIComponent(String(id))}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/logAggregationPoints', { ...reqOptions, body });
    }
    update(id, patchBody, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/logAggregationPoints/${encodeURIComponent(String(id))}`, { ...reqOptions, body: patchBody });
    }
    delete(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('DELETE', `/cdn/logAggregationPoints/${encodeURIComponent(String(id))}`, reqOptions);
    }
    summary(reqOptions = {}) {
        return this.api.request('GET', '/cdn/logAggregationPoints/summaryReport', reqOptions);
    }
}
exports.LogAggregationPoints = LogAggregationPoints;
//# sourceMappingURL=LogAggregationPoints.js.map