import type { JobsOptions } from 'bullmq'

import { queues, type QueueName } from '../queue/queues'

export abstract class Job<TPayload> {
  static queueName = 'default'
  static retries = 3

  abstract handle(payload: TPayload): Promise<void>

  static async dispatch<T>(
    this: new () => Job<T>,
    payload: T,
    options?: JobsOptions,
  ): Promise<void> {
    const queueName = ((this as any).queueName ?? 'default') as QueueName

    const queue = queues[queueName]

    await queue.add(this.name, payload, {
      attempts: (this as any).retries ?? 3,
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    })
  }
}
