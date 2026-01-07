export type QueueConfig = {
  name: string
  concurrency: number
}

export const queueConfig: QueueConfig[] = [
  {
    name: 'default',
    concurrency: 2,
  },
  {
    name: 'emails',
    concurrency: 2,
  },
]
