import type { StringValue } from "ms";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME: string;
      HOSTNAME: string;
      PORT: string;
      JWT_SECRET: string;
      JWT_MAX_AGE: StringValue;
      DATABASE_URL: string;
      TURSO_ORG: string;
      TURSO_API_TOKEN: string;
      TURSO_GROUP_TOKEN: string;
      SENTRY_DSN: string;
      QUEUE_DASHBOARD_ENABLED: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD: string;
    }
  }
}

export {};