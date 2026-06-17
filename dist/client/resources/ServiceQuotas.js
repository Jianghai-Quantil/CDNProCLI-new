"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceQuotas = void 0;
class ServiceQuotas {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/serviceQuotas', { ...reqOptions, query: query });
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/serviceQuotas', { ...reqOptions, body });
    }
    get(serviceQuotaId, reqOptions = {}) {
        if (!serviceQuotaId)
            throw new Error('serviceQuotaId is required');
        return this.api.request('GET', `/cdn/serviceQuotas/${encodeURIComponent(serviceQuotaId)}`, reqOptions);
    }
    getByCustomer(customerId, reqOptions = {}) {
        if (!customerId)
            throw new Error('customerId is required');
        return this.api.request('GET', `/cdn/serviceQuotas/customer/${encodeURIComponent(String(customerId))}`, reqOptions);
    }
    update(serviceQuotaId, patchBody, reqOptions = {}) {
        if (!serviceQuotaId)
            throw new Error('serviceQuotaId is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/serviceQuotas/${encodeURIComponent(serviceQuotaId)}`, { ...reqOptions, body: patchBody });
    }
    updateByCustomer(customerId, patchBody, reqOptions = {}) {
        if (!customerId)
            throw new Error('customerId is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/serviceQuotas/customer/${encodeURIComponent(String(customerId))}`, { ...reqOptions, body: patchBody });
    }
}
exports.ServiceQuotas = ServiceQuotas;
//# sourceMappingURL=ServiceQuotas.js.map