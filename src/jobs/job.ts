import type { JobsOptions } from 'bullmq'

import { queues, type QueueName } from '../queue/queues'

export abstract class Job<TPayload> {
  static queueName = 'default'
  static retries = 3
  static backoff = {
    type: 'exponential',
    delay: 1000,
  }
  static timeout = 30_000
  static delay = 0

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
      backoff: (this as any).backoff,
      delay: (this as any).delay ?? 0,
      removeOnComplete: true,
      removeOnFail: false,
      ...(options as any),
      timeout: (this as any).timeout,
    } as any)
  }

  static async dispatchAfter<T>(
    this: new () => Job<T>,
    payload: T,
    delayMs: number,
    options?: JobsOptions,
  ): Promise<void> {
    const queueName = ((this as any).queueName ?? 'default') as QueueName
    const queue = queues[queueName]

    await queue.add(this.name, payload, {
      attempts: (this as any).retries ?? 3,
      backoff: (this as any).backoff,
      delay: delayMs,
      removeOnComplete: true,
      removeOnFail: false,
      ...(options as any),
      timeout: (this as any).timeout,
    } as any)
  }
}
