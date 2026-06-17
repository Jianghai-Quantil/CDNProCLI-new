import { ServerInfo } from '../client/ApiCore';
/** Shape stored in the conf JSON file — never contains the secret key. */
export interface StoredProfile {
    host: string;
    user: string;
    /** Present only when keychain is unavailable and secret must be stored as fallback. */
    secretKey?: string;
}
/** Fully-resolved in-memory profile with the secret key. Never persisted. */
export interface Profile {
    host: string;
    user: string;
    secretKey: string;
}
export interface CdnProConfig extends Record<string, unknown> {
    defaultProfile: string;
    profiles: Record<string, StoredProfile>;
}
export interface GlobalOptions {
    profile?: string;
    host?: string;
    user?: string;
    secretKey?: string;
    output?: string;
    noColor?: boolean;
    verbose?: number;
    onBehalfOf?: string;
}
export declare function resolveCredentials(globalOpts: GlobalOptions): Promise<ServerInfo>;
export declare function getProfile(name: string): StoredProfile | undefined;
export declare function saveProfile(name: string, profile: Profile): Promise<void>;
export declare function deleteProfile(name: string): Promise<void>;
export declare function listProfiles(): Record<string, StoredProfile>;
export declare function getDefaultProfile(): string;
export declare function setDefaultProfile(name: string): void;
/** Prompt for input. Pass silent=true to hide typed characters (for secret keys). */
export declare function promptInput(question: string, silent?: boolean): Promise<string>;
//# sourceMappingURL=config.d.ts.map