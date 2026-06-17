import { ApiCore, RequestOptions } from '../ApiCore';

export class ServiceQuotas {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/serviceQuotas', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/cdn/serviceQuotas', { ...reqOptions, body });
  }

  get(serviceQuotaId: string, reqOptions: RequestOptions = {}) {
    if (!serviceQuotaId) throw new Error('serviceQuotaId is required');
    return this.api.request('GET', `/cdn/serviceQuotas/${encodeURIComponent(serviceQuotaId)}`, reqOptions);
  }

  getByCustomer(customerId: string | number, reqOptions: RequestOptions = {}) {
    if (!customerId) throw new Error('customerId is required');
    return this.api.request('GET', `/cdn/serviceQuotas/customer/${encodeURIComponent(String(customerId))}`, reqOptions);
  }

  update(serviceQuotaId: string, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (!serviceQuotaId) throw new Error('serviceQuotaId is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/cdn/serviceQuotas/${encodeURIComponent(serviceQuotaId)}`, { ...reqOptions, body: patchBody });
  }

  updateByCustomer(customerId: string | number, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (!customerId) throw new Error('customerId is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/cdn/serviceQuotas/customer/${encodeURIComponent(String(customerId))}`, { ...reqOptions, body: patchBody });
  }
}
