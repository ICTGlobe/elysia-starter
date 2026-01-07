import { Queue } from 'bullmq'

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password:
    process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD !== 'null'
      ? process.env.REDIS_PASSWORD
      : undefined,
}

export const queues = {
  default: new Queue('default', { connection }),
  emails: new Queue('emails', { connection }),
} as const

export type QueueName = keyof typeof queues
