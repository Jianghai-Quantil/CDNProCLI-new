import { ApiCore, RequestOptions } from '../ApiCore';

export class EdgeHostnames {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/edgeHostnames', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(edgeHostname: string, reqOptions: RequestOptions = {}) {
    if (!edgeHostname) throw new Error('edgeHostname is required');
    return this.api.request('GET', `/cdn/edgeHostnames/${encodeURIComponent(edgeHostname)}`, reqOptions);
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/cdn/edgeHostnames', { ...reqOptions, body });
  }

  replace(edgeHostname: string, body: unknown, reqOptions: RequestOptions = {}) {
    if (!edgeHostname) throw new Error('edgeHostname is required');
    if (!body) throw new Error('body is required');
    return this.api.request('PUT', `/cdn/edgeHostnames/${encodeURIComponent(edgeHostname)}`, { ...reqOptions, body });
  }

  update(edgeHostname: string, patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (!edgeHostname) throw new Error('edgeHostname is required');
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', `/cdn/edgeHostnames/${encodeURIComponent(edgeHostname)}`, { ...reqOptions, body: patchBody });
  }

  delete(edgeHostname: string, reqOptions: RequestOptions = {}) {
    if (!edgeHostname) throw new Error('edgeHostname is required');
    return this.api.request('DELETE', `/cdn/edgeHostnames/${encodeURIComponent(edgeHostname)}`, reqOptions);
  }
}
