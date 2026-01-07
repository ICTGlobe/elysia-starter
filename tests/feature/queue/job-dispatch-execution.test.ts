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

test('dispatching a Job executes its handler via worker', async () => {
  const queueName = 'default'
  const queue = new Queue(queueName, { connection })

  let executedPayload: any = null

  const worker = new Worker(
    queueName,
    async job => {
      const factory = jobHandlers[job.name]
      if (!factory) {
        throw new Error(`Unknown job: ${job.name}`)
      }

      // intercept execution for assertion
      const instance = factory()
      const originalHandle = instance.handle.bind(instance)

      instance.handle = async (payload: unknown) => {
        executedPayload = payload
        await originalHandle(payload as any)
      }

      await instance.handle(job.data)
    },
    { connection },
  )

  await ExampleJob.dispatch({ message: 'hello from test' })

  const start = Date.now()
  while (!executedPayload && Date.now() - start < 3000) {
    await new Promise(r => setTimeout(r, 50))
  }

  expect(executedPayload).toEqual({ message: 'hello from test' })

  await worker.close()
  await queue.obliterate({ force: true })
})