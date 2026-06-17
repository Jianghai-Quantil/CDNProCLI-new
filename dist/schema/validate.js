"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
const ajv_1 = __importDefault(require("ajv"));
const loader_1 = require("./loader");
let _ajv = null;
function getAjv() {
    if (!_ajv) {
        _ajv = new ajv_1.default({ allErrors: true, strict: false });
    }
    return _ajv;
}
/**
 * Validates a request body against the JSON Schema for the given OpenAPI path + method.
 * Returns valid=true and empty errors when no schema is found for the operation.
 */
function validateBody(openapiPath, method, body) {
    const { schema } = (0, loader_1.getRequestBodySchema)(openapiPath, method);
    if (!schema)
        return { valid: true, errors: [], schema: null };
    const ajv = getAjv();
    const valid = ajv.validate(schema, body);
    const errors = ajv.errors ? [...ajv.errors] : [];
    return { valid, errors, schema };
}
//# sourceMappingURL=validate.js.map