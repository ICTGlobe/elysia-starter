import { test, expect } from 'bun:test'
import { Queue, Worker } from 'bullmq'

import { ExampleJob } from '../../../src/jobs/example-job'
import { jobHandlers } from '../../../src/queue/job-handlers'

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password:
    process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD !== 'null'
      ? process.env.REDIS_PASSWORD
      : undefined,
}

test('job is not executed before delay and runs after delay', async () => {
  const queueName = 'default'
  const queue = new Queue(queueName, { connection })
  await queue.obliterate({ force: true })

  let executedAt: number | null = null
  const delayMs = 1000

  const worker = new Worker(
    queueName,
    async job => {
      const factory = jobHandlers[job.name]
      const instance = factory()
      executedAt = Date.now()
      await instance.handle(job.data)
    },
    { connection },
  )

  const start = Date.now()
  await ExampleJob.dispatchAfter({ message: 'delay test' }, delayMs)

  // wait up to 3s
  while (!executedAt && Date.now() - start < 3000) {
    await new Promise(r => setTimeout(r, 50))
  }

  expect(executedAt).not.toBeNull()
  expect((executedAt as unknown as number) - start).toBeGreaterThanOrEqual(delayMs)

  await worker.close()
  await queue.obliterate({ force: true })
}, 10000)