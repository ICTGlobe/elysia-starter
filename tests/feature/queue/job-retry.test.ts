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

test('job retries when handler throws and eventually succeeds', async () => {
  const queueName = 'default'
  const queue = new Queue(queueName, { connection })
  await queue.obliterate({ force: true })

  let attempts = 0

  const worker = new Worker(
    queueName,
    async job => {
      const factory = jobHandlers[job.name]
      const instance = factory()

      const originalHandle = instance.handle.bind(instance)
      instance.handle = async (payload: unknown) => {
        attempts++
        if (attempts < 2) {
          throw new Error('Simulated failure')
        }
        await originalHandle(payload as any)
      }

      await instance.handle(job.data)
    },
    { connection },
  )

  await ExampleJob.dispatch({ message: 'retry test' }, { attempts: 2 })

  const start = Date.now()
  while (attempts < 2 && Date.now() - start < 5000) {
    await new Promise(r => setTimeout(r, 100))
  }

  expect(attempts).toBe(2)

  await worker.close()
  await queue.obliterate({ force: true })
}, 10000)