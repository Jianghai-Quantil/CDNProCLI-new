import { ApiCore, RequestOptions } from '../ApiCore';

export class Report {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  post(endpointPath: string, { query = {}, body = {} }: { query?: Record<string, unknown>; body?: unknown } = {}, reqOptions: RequestOptions = {}) {
    if (!endpointPath) throw new Error('endpointPath is required');
    const path = endpointPath.startsWith('/cdn/report/') ? endpointPath : `/cdn/report/${endpointPath.replace(/^\/+/, '')}`;
    return this.api.request('POST', path, { ...reqOptions, query: query as RequestOptions['query'], body });
  }

  bandwidth(query: Record<string, unknown> = {}, body: unknown = {}, reqOptions: RequestOptions = {}) {
    return this.post('/cdn/report/bandwidth', { query, body }, reqOptions);
  }

  vol(query: Record<string, unknown> = {}, body: unknown = {}, reqOptions: RequestOptions = {}) {
    return this.post('/cdn/report/vol', { query, body }, reqOptions);
  }

  volSummary(query: Record<string, unknown> = {}, body: unknown = {}, reqOptions: RequestOptions = {}) {
    return this.post('/cdn/report/volSummary', { query, body }, reqOptions);
  }

  req(query: Record<string, unknown> = {}, body: unknown = {}, reqOptions: RequestOptions = {}) {
    return this.post('/cdn/report/req', { query, body }, reqOptions);
  }

  reqSummary(query: Record<string, unknown> = {}, body: unknown = {}, reqOptions: RequestOptions = {}) {
    return this.post('/cdn/report/reqSummary', { query, body }, reqOptions);
  }

  cpuTime(query: Record<string, unknown> = {}, body: unknown = {}, reqOptions: RequestOptions = {}) {
    return this.post('/cdn/report/cpuTime', { query, body }, reqOptions);
  }

  logDownload(query: Record<string, unknown> = {}, body: unknown = {}, reqOptions: RequestOptions = {}) {
    return this.post('/cdn/report/logDownload', { query, body }, reqOptions);
  }
}
