export interface MysqlConnectionSettings {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}
export interface DatabaseConfig {
    proofing: MysqlConnectionSettings;
    koken: MysqlConnectionSettings;
}
export declare const PROOFING_DB = "PROOFING_DB_CONNECTION";
export declare const KOKEN_DB = "KOKEN_DB_CONNECTION";
declare const _default: import("@nestjs/config").ConfigFactory<DatabaseConfig> & import("@nestjs/config").ConfigFactoryKeyHost<DatabaseConfig | Promise<DatabaseConfig>>;
export default _default;
