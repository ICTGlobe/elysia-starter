import { test, expect } from 'bun:test'
import { Queue, Worker } from 'bullmq'

import { Job } from '../../../src/jobs/job'
import { jobHandlers } from '../../../src/queue/job-handlers'

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password:
    process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD !== 'null'
      ? process.env.REDIS_PASSWORD
      : undefined,
}

test('queue rate limiting throttles job execution', async () => {
  const queueName = 'rate-limit-test'

  const queue = new Queue(queueName, { connection })

  const executionTimes: number[] = []

  const worker = new Worker(
    queueName,
    async job => {
      executionTimes.push(Date.now())
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 2,
        duration: 1000,
      },
    },
  )

  const start = Date.now()

  // Enqueue 5 jobs immediately (directly to test queue)
  await Promise.all([
    queue.add('RateLimitTestJob', { message: '1' }),
    queue.add('RateLimitTestJob', { message: '2' }),
    queue.add('RateLimitTestJob', { message: '3' }),
    queue.add('RateLimitTestJob', { message: '4' }),
    queue.add('RateLimitTestJob', { message: '5' }),
  ])

  // Wait until all jobs have executed or timeout
  while (executionTimes.length < 5 && Date.now() - start < 8000) {
    await new Promise(r => setTimeout(r, 50))
  }

  expect(executionTimes.length).toBe(5)

  // First 2 jobs should run within the first second
  const firstWindow = executionTimes.filter(t => t - start < 1000)

  // Remaining jobs should spill into later windows
  const laterWindow = executionTimes.filter(t => t - start >= 1000)

  expect(firstWindow.length).toBeLessThanOrEqual(2)
  expect(laterWindow.length).toBeGreaterThanOrEqual(3)

  await worker.close()
  await queue.obliterate({ force: true })
}, 10000)