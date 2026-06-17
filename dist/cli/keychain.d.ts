/**
 * Thin wrapper around keytar that provides graceful fallback when the OS
 * keychain is unavailable (headless CI, missing libsecret on Linux, etc.).
 *
 * No other module should import keytar directly — use this module instead.
 */
export declare function isKeychainAvailable(): Promise<boolean>;
export declare function warnKeychainUnavailable(): void;
export declare function getSecret(profileName: string): Promise<string | null>;
export declare function setSecret(profileName: string, secretKey: string): Promise<void>;
export declare function deleteSecret(profileName: string): Promise<void>;
//# sourceMappingURL=keychain.d.ts.map