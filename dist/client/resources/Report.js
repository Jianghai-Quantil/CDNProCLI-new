"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
class Report {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    post(endpointPath, { query = {}, body = {} } = {}, reqOptions = {}) {
        if (!endpointPath)
            throw new Error('endpointPath is required');
        const path = endpointPath.startsWith('/cdn/report/') ? endpointPath : `/cdn/report/${endpointPath.replace(/^\/+/, '')}`;
        return this.api.request('POST', path, { ...reqOptions, query: query, body });
    }
    bandwidth(query = {}, body = {}, reqOptions = {}) {
        return this.post('/cdn/report/bandwidth', { query, body }, reqOptions);
    }
    vol(query = {}, body = {}, reqOptions = {}) {
        return this.post('/cdn/report/vol', { query, body }, reqOptions);
    }
    volSummary(query = {}, body = {}, reqOptions = {}) {
        return this.post('/cdn/report/volSummary', { query, body }, reqOptions);
    }
    req(query = {}, body = {}, reqOptions = {}) {
        return this.post('/cdn/report/req', { query, body }, reqOptions);
    }
    reqSummary(query = {}, body = {}, reqOptions = {}) {
        return this.post('/cdn/report/reqSummary', { query, body }, reqOptions);
    }
    cpuTime(query = {}, body = {}, reqOptions = {}) {
        return this.post('/cdn/report/cpuTime', { query, body }, reqOptions);
    }
    logDownload(query = {}, body = {}, reqOptions = {}) {
        return this.post('/cdn/report/logDownload', { query, body }, reqOptions);
    }
}
exports.Report = Report;
//# sourceMappingURL=Report.js.map