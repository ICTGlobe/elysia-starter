export type QueueConfig = {
  name: string
  concurrency: number
  rateLimit?: {
    max: number
    duration: number
  }
}

export const queueConfig: QueueConfig[] = [
  {
    name: 'default',
    concurrency: 2,
  },
  {
    name: 'emails',
    concurrency: 2,
    rateLimit: {
      max: 10,
      duration: 60_000,
    },
  },
]
