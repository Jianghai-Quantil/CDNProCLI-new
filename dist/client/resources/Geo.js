"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Geo = void 0;
class Geo {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    clientRegions(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/clientRegions', { ...reqOptions, query: query });
    }
    isps(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/isps', { ...reqOptions, query: query });
    }
    stagingServers(reqOptions = {}) {
        return this.api.request('GET', '/cdn/stagingServers', reqOptions);
    }
    publicIpList(reqOptions = {}) {
        return this.api.request('GET', '/cdn/publicIpList', reqOptions);
    }
    originFastRouteIpList(reqOptions = {}) {
        return this.api.request('GET', '/cdn/originFastRouteIpList', reqOptions);
    }
    ipDetails(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/ngadmin/ipDetails', { ...reqOptions, body });
    }
}
exports.Geo = Geo;
//# sourceMappingURL=Geo.js.map