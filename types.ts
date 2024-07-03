declare namespace NodeJS {
  interface ProcessEnv {
    HOSTNAME: string;
    PORT: string;
    JWT_SECRET: string;
    JWT_MAX_AGE: string;
    DATABASE_NAME: string;
    DATABASE_AUTH_TOKEN: string;
    TURSO_ORG: string;
    TURSO_API_TOKEN: string;
    TURSO_GROUP_TOKEN: string;
    SENTRY_DSN: string;
  }
}
