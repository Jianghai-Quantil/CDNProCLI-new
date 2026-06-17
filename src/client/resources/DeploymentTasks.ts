import { ApiCore, RequestOptions } from '../ApiCore';

export class DeploymentTasks {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  list(query: Record<string, unknown> = {}, reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/deploymentTasks', { ...reqOptions, query: query as RequestOptions['query'] });
  }

  get(id: string, reqOptions: RequestOptions = {}) {
    if (!id) throw new Error('id is required');
    return this.api.request('GET', `/cdn/deploymentTasks/${encodeURIComponent(id)}`, reqOptions);
  }

  create(body: unknown, reqOptions: RequestOptions = {}) {
    if (!body) throw new Error('body is required');
    return this.api.request('POST', '/cdn/deploymentTasks', { ...reqOptions, body });
  }
}
