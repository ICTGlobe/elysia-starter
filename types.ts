declare namespace NodeJS {
  interface ProcessEnv {
    APP_NAME: string;
    HOSTNAME: string;
    PORT: string;
    JWT_SECRET: string;
    JWT_MAX_AGE: string;
    DATABASE_URL: string;
    TURSO_ORG: string;
    TURSO_API_TOKEN: string;
    TURSO_GROUP_TOKEN: string;
    SENTRY_DSN: string;
  }
}
