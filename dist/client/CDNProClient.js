"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDNProClient = void 0;
const ApiCore_1 = require("./ApiCore");
const Properties_1 = require("./resources/Properties");
const Certificates_1 = require("./resources/Certificates");
const DeploymentTasks_1 = require("./resources/DeploymentTasks");
const EdgeHostnames_1 = require("./resources/EdgeHostnames");
const Purges_1 = require("./resources/Purges");
const Prefetches_1 = require("./resources/Prefetches");
const Secrets_1 = require("./resources/Secrets");
const Webhooks_1 = require("./resources/Webhooks");
const Validations_1 = require("./resources/Validations");
const ServiceQuotas_1 = require("./resources/ServiceQuotas");
const Report_1 = require("./resources/Report");
const LogConfigs_1 = require("./resources/LogConfigs");
const LogAggregationPoints_1 = require("./resources/LogAggregationPoints");
const Annotations_1 = require("./resources/Annotations");
const SystemConfigs_1 = require("./resources/SystemConfigs");
const Customers_1 = require("./resources/Customers");
const Geo_1 = require("./resources/Geo");
const ResourceSummary_1 = require("./resources/ResourceSummary");
const Hostnames_1 = require("./resources/Hostnames");
const HostnameHistory_1 = require("./resources/HostnameHistory");
const ApiPermissions_1 = require("./resources/ApiPermissions");
const Shields_1 = require("./resources/Shields");
const Contacts_1 = require("./resources/Contacts");
const ApiAccounts_1 = require("./resources/ApiAccounts");
const ApiCalls_1 = require("./resources/ApiCalls");
/**
 * CDN Pro API client.
 *
 * @example
 * const client = new CDNProClient({ host: 'ngapi.cdnetworks.com', user: '...', secretKey: '...' });
 * const props = await client.properties.list({ limit: 10 });
 */
class CDNProClient {
    serverInfo;
    _api;
    properties;
    certificates;
    edgeHostnames;
    secrets;
    deployments;
    /** Alias for deployments */
    deploymentTasks;
    serviceQuotas;
    report;
    logConfigs;
    logAggregationPoints;
    annotations;
    systemConfigs;
    customers;
    validations;
    webhooks;
    purges;
    prefetches;
    geo;
    resourceSummary;
    hostnames;
    hostnameHistory;
    apiPermissions;
    shields;
    contacts;
    apiAccounts;
    apiCalls;
    constructor(serverInfo) {
        this.serverInfo = serverInfo;
        this._api = new ApiCore_1.ApiCore(serverInfo);
        this.properties = new Properties_1.Properties(this._api);
        this.certificates = new Certificates_1.Certificates(this._api);
        this.edgeHostnames = new EdgeHostnames_1.EdgeHostnames(this._api);
        this.secrets = new Secrets_1.Secrets(this._api);
        this.deployments = new DeploymentTasks_1.DeploymentTasks(this._api);
        this.deploymentTasks = this.deployments;
        this.serviceQuotas = new ServiceQuotas_1.ServiceQuotas(this._api);
        this.report = new Report_1.Report(this._api);
        this.logConfigs = new LogConfigs_1.LogConfigs(this._api);
        this.logAggregationPoints = new LogAggregationPoints_1.LogAggregationPoints(this._api);
        this.annotations = new Annotations_1.Annotations(this._api);
        this.systemConfigs = new SystemConfigs_1.SystemConfigs(this._api);
        this.customers = new Customers_1.Customers(this._api);
        this.validations = new Validations_1.Validations(this._api);
        this.webhooks = new Webhooks_1.Webhooks(this._api);
        this.purges = new Purges_1.Purges(this._api);
        this.prefetches = new Prefetches_1.Prefetches(this._api);
        this.geo = new Geo_1.Geo(this._api);
        this.resourceSummary = new ResourceSummary_1.ResourceSummary(this._api);
        this.hostnames = new Hostnames_1.Hostnames(this._api);
        this.hostnameHistory = new HostnameHistory_1.HostnameHistory(this._api);
        this.apiPermissions = new ApiPermissions_1.ApiPermissions(this._api);
        this.shields = new Shields_1.Shields(this._api);
        this.contacts = new Contacts_1.Contacts(this._api);
        this.apiAccounts = new ApiAccounts_1.ApiAccounts(this._api);
        this.apiCalls = new ApiCalls_1.ApiCalls(this._api);
    }
    /** Low-level escape hatch to call any endpoint directly. */
    request(method, path, reqOptions = {}) {
        return this._api.request(method, path, reqOptions);
    }
}
exports.CDNProClient = CDNProClient;
//# sourceMappingURL=CDNProClient.js.map