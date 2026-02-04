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
      QUEUE_DASHBOARD_ENABLED: boolean;
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD: string;
      LOGGING_ENABLED: boolean;
    }
  }
}

export {};