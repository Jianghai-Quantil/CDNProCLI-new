import { ApiCore, RequestOptions } from '../ApiCore';

export class SystemConfigs {
  private api: ApiCore;

  constructor(apiCore: ApiCore) {
    this.api = apiCore;
  }

  get(reqOptions: RequestOptions = {}) {
    return this.api.request('GET', '/cdn/systemConfigs', reqOptions);
  }

  update(patchBody: unknown, reqOptions: RequestOptions = {}) {
    if (!patchBody) throw new Error('patchBody is required');
    return this.api.request('PATCH', '/cdn/systemConfigs', { ...reqOptions, body: patchBody });
  }
}
