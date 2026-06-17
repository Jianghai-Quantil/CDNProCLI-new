import { ApiCore, RequestOptions } from '../ApiCore';

export class LogAggregationPoints {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/logAggregationPoints', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(id: string | number, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    return this.api.request('GET', `/cdn/logAggregationPoints/${encodeURIComponent(String(id))}`, reqOptions);
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/cdn/logAggregationPoints', { ...reqOptions, body });
  }

  update(id: string | number, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/cdn/logAggregationPoints/${encodeURIComponent(String(id))}`, { ...reqOptions, body: patchBody });
  }

  delete(id: string | number, reqOptions: RequestOptions = {}) {
    if (id === undefined || id === null || id === '') throw new Error('id is required');
    return this.api.request('DELETE', `/cdn/logAggregationPoints/${encodeURIComponent(String(id))}`, reqOptions);
  }

  summary(reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/logAggregationPoints/summaryReport', reqOptions);
  }
}
